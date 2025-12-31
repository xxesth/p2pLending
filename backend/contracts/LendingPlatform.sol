// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Minimal interface for Chainlink
interface AggregatorV3Interface {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
    function decimals() external view returns (uint8);
}

contract LendingPlatform is ReentrancyGuard {
    // --- State Variables ---
    IERC20 public lendingToken; // The token being borrowed (DUSD)
    AggregatorV3Interface public priceFeed; // ETH/USD Oracle

    struct Loan {
        uint256 id;
        address borrower;
        address lender;
        uint256 amount;        // Amount of DUSD
        uint256 collateralAmount; // Amount of ETH locked
        uint256 interest;      // Flat interest amount
        uint256 startTime;
        uint256 duration;
        bool active;
        bool funded;
        string ipfsHash;       // Metadata (Reason for loan, etc.)
        bytes32 loanAgreementHash;
    }

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256) public reputation; // User Address -> Score (0-100)
    uint256 public loanCounter;

    // Collateral Ratios
    uint256 public constant BASE_COLLATERAL_RATIO = 150; // 150%
    uint256 public constant MIN_COLLATERAL_RATIO = 110;  // 110% (for high rep users)
    
    // Events
    event LoanRequested(uint256 indexed id, address indexed borrower, uint256 amount);
    event LoanFunded(uint256 indexed id, address indexed lender);
    event LoanRepaid(uint256 indexed id, address indexed borrower);
    event CollateralLiquidated(uint256 indexed id, address indexed liquidator);

    constructor(address _tokenAddress, address _oracleAddress) {
        lendingToken = IERC20(_tokenAddress);
        priceFeed = AggregatorV3Interface(_oracleAddress);
    }

    // --- Helper: Get ETH Price in USD ---
    // Returns price with 18 decimals
    function getEthPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        uint8 decimals = priceFeed.decimals();
        // Chainlink usually returns 8 decimals for USD pairs. We scale to 18.
        return uint256(price) * (10 ** (18 - decimals));
    }

    // --- Core Logic ---

    // 1. Calculate required collateral based on Reputation
    function getRequiredCollateralRatio(address _user) public view returns (uint256) {
        uint256 userRep = reputation[_user];
        if (userRep >= 40) return MIN_COLLATERAL_RATIO; // High rep = Low collateral
        // Linear scaling could be implemented here, simple step for now
        return BASE_COLLATERAL_RATIO; 
    }

    // 2. Request a Loan (Borrower locks ETH)
    function createLoanRequest(
        uint256 _amountToBorrow, 
        uint256 _interest, 
        uint256 _duration,
        string memory _ipfsHash
    ) external payable nonReentrant {
        require(_amountToBorrow > 0, "Amount must be > 0");
        require(msg.value > 0, "No collateral provided");

        uint256 ethPrice = getEthPrice(); 
        uint256 collateralValueInUsd = (msg.value * ethPrice) / 1e18; // Assuming DUSD is 18 decimals ~ $1
        
        uint256 ratio = getRequiredCollateralRatio(msg.sender);
        uint256 requiredValue = (_amountToBorrow * ratio) / 100;

        require(collateralValueInUsd >= requiredValue, "Insufficient Collateral");

        loanCounter++;

        bytes32 agreementHash = keccak256(
            abi.encodePacked(
                msg.sender, 
                _amountToBorrow, 
                _interest, 
                block.timestamp,
                _ipfsHash
            )
        );

        loans[loanCounter] = Loan({
            id: loanCounter,
            borrower: msg.sender,
            lender: address(0),
            amount: _amountToBorrow,
            collateralAmount: msg.value,
            interest: _interest,
            startTime: 0,
            duration: _duration,
            active: true,
            funded: false,
            ipfsHash: _ipfsHash,
            loanAgreementHash: agreementHash
        });

        emit LoanRequested(loanCounter, msg.sender, _amountToBorrow);
    }

    // 3. Fund a Loan (Lender sends DUSD)
    function fundLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.active, "Loan not active");
        require(!loan.funded, "Loan already funded");
        require(msg.sender != loan.borrower, "Cannot fund own loan");

        // Transfer DUSD from Lender to Borrower
        // Lender must approve contract first
        bool success = lendingToken.transferFrom(msg.sender, loan.borrower, loan.amount);
        require(success, "Token transfer failed");

        loan.lender = msg.sender;
        loan.funded = true;
        loan.startTime = block.timestamp;

        emit LoanFunded(_loanId, msg.sender);
    }

    // 4. Repay Loan (Borrower sends DUSD + Interest)
    function repayLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.funded, "Loan not funded");
        require(loan.active, "Loan closed");
        
        uint256 totalRepayment = loan.amount + loan.interest;
        
        // Transfer repayment from Borrower to Lender
        bool success = lendingToken.transferFrom(msg.sender, loan.lender, totalRepayment);
        require(success, "Repayment failed");

        // Unlock Collateral
        uint256 collateralReturn = loan.collateralAmount;
        loan.collateralAmount = 0;
        loan.active = false;

        // Increase Reputation
        reputation[loan.borrower] += 10; // Simple +10 points

        // Send ETH back
        (bool sent, ) = payable(loan.borrower).call{value: collateralReturn}("");
        require(sent, "ETH return failed");

        emit LoanRepaid(_loanId, loan.borrower);
    }

    // 5. Liquidation (If ETH price crashes)
    function liquidate(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.funded && loan.active, "Invalid loan state");

        uint256 ethPrice = getEthPrice();
        uint256 collateralValue = (loan.collateralAmount * ethPrice) / 1e18;
        
        // Liquidation Threshold: If collateral drops below 105% of loan value
        uint256 threshold = (loan.amount * 105) / 100;

        require(collateralValue < threshold, "Collateral value still high");

        // Liquidator pays the lender the loan amount to buy the cheap collateral
        // This makes the liquidator the new owner of the collateral
        bool success = lendingToken.transferFrom(msg.sender, loan.lender, loan.amount);
        require(success, "Liquidation payment failed");

        // Liquidator gets the ETH
        uint256 collateralSeized = loan.collateralAmount;
        loan.collateralAmount = 0;
        loan.active = false;

        // Penalize Reputation
        if (reputation[loan.borrower] >= 5) {
            reputation[loan.borrower] -= 5;
        } else {
            reputation[loan.borrower] = 0;
        }

        (bool sent, ) = payable(msg.sender).call{value: collateralSeized}("");
        require(sent, "Seize collateral failed");

        emit CollateralLiquidated(_loanId, msg.sender);
    }

    function getLoanDetails(uint256 _id) external view returns (Loan memory) {
        return loans[_id];
    }
}