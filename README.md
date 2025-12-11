 Before start please use the enviroment on the remix which is given by the teacher on the class.The one give by the teacher is based on this link:https://remix.ethereum.org/
It should have these contents:
-.deps
-.states
-artifacts
-contracts
-scripts
-tests
-.prettierrc.json
-README.txt (the readme here is not the one for our project)
-remix.config.json

And you should up load my file MockERC20.sol or simplep2p.sol into  the file "/contracts", or simply subsitute the contracts with the new one I have sent you.

And then you should have:
1_storage.sol
2_Owner.sol
3_Ballot.sol
MockERC20.sol
simplep2p.sol
in the file contracts.

1.1 First we open MockERC20.sol and press ctrl+s to do the compile.

1.2 We do the deploy, be attention! You should use Remix VM. And remember this account you use now, we call it Account A, and its address is address A.
DO NOT entre any value, just deploy it.

1.3 Now you have deployed it, there's many button(or functions).

1.4 And after this, we need to compile simplep2p.md, click it and press ctrl+s to do the compile, and then we need to do the deploy. When we do teh deploy, you must copy the address of MOCKERC20!!![alt text](image.png) It is the address of the Deployed COntracts.And paste it into the Deploy adress of the simplep2p (NOT in the At Address, but in the Deploy, the orange one).![alt text](image-1.png).(If you open the samll arrow there should be a line stable coin Adress)

2.1 We use account A now to act as the bank.First in MOCKERC20, click the function Mint and entre address A and a big amount of solidcoins,for example:500000000000000000000000000000

2.2 Then click the function approve, in the spender you should input the address of the simplep2p contract ![alt text](image-2.png). The value should be very big enough, so we can take 9999999999999999999999999999999999999999 as an example.

2.3 Click the balanceof function,input the address A,you should get '0:
uint256: 500000000000000000000000000000'as an output. This is the solidcoin which is hold by the bank.

2.4 Click the allwance function, input owner as the address A, and the spender is the address of simplep2p contract. you should get '0:
uint256: 9999999999999999999999999999999999999999' This is the amoumt of the money allowed to be transfered in p2p contract.

2.5 Now we change the account to another one, we call it B, the customer with its address B.Now we change the value as 1 Ether (not Wei) and click the function depositAndBorrow in simplep2p contract. You will se the Balance should be changed into 1.0 ETH.

2.6 We click the collateral function, with the address B:' 0:uint256: 1000000000000000000' It should be the value of 1 ETH. We click the debt,with the address B, it should be '0:uint256: 40000000000000000000000' This value is so big,we can adjust it in the future,here just as an example.

2.7 We back to MOCKERC20, click Balanceof with the  address B, it should also be '0:uint256: 40000000000000000000000'

3.1 Now we need to pay back, but one thing is important, the money of interest. We have to use transfer function let A give some money to B, because we can not use B to create money in this simulation. And also we can test the function transfer.

3.2 First, Above, change the account B to account A, and the click transfer funciton, enter the address of B, the value can be '960000000000000000000000'

3.3 check with the balanceof, with the address B '0:uint256: 1000000000000000000000000' The transfer operation is success.

3.4 Above,We change the account from account A back to B,and in the approve , remain the spender and value as the address of simplep2p contract and a big value.

3.5 We roll down ,still with the account B, do repayAndWithdraw.Wait for a few minutes.

3.6 The debt and collateral should be 0.

