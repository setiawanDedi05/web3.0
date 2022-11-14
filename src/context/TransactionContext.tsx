import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { contractAbi, contractAddress } from "../utils/constans";

declare global {
    interface Window {
        ethereum: any
        reload: Function
    }
}


const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const trasactionContract = new ethers.Contract(contractAddress, contractAbi, signer);

    return trasactionContract;
}

interface FormDataType {
    addressTo: string
    amount: string
    keyword: string
    message: string
}

export interface TransactionContextType {
    connectWallet: () => {}
    currentAccount: string
    formData: FormDataType
    handleChange: () => {}
    transactions: []
    sendTransaction: () => {}
    loading:boolean
}

export const TransactionContext = React.createContext({} as ReturnType<any>);

export interface TransactionType {
    id: number;
    url: string;
    message: string;
    timestamp: string;
    addressFrom: string;
    amount: string;
    keyword: string;
    addressTo: string;
}

export const TransactionProvider = ({ children }: any) => {
    const [currentAccount, setCurrentAccount] = useState<string>('');
    const [formData, setFormData] = useState<FormDataType>({
        addressTo: '',
        amount: '',
        keyword: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState<TransactionType[]>([])

    const handleChange = (e: any, name: string) => {
        setFormData((prev) => ({ ...prev, [name]: e.target.value }));
    }
    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert('please install metamask');
            const transactionContract = getEthereumContract();
            const availableTransaction = await transactionContract.getAllTransactions();

            const structuredTransaction = availableTransaction.map((transaction: any, index: number) => ({
                addressTo: transaction.receiver,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                message: transaction.message,
                keyword: transaction.keyword,
                amount: parseInt(transaction.amount._hex) / (10 ** 18)
            }))
            console.log(availableTransaction)
            setTransactions(structuredTransaction);
        } catch (error) {
            console.log(error);
        }
    }
    const checkIFWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert('please install metamask');
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                getAllTransactions();
            } else {
                console.log("no Account found");
            }
        } catch (error) {
            console.log(error);
            throw new Error("No Ethereum Object");
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('please install metamask');
            const account = await ethereum.request({ method: 'eth_requestAccounts' });

            setCurrentAccount(account[0]);
        } catch (error) {
            console.log(error);
            throw new Error("No Ethereum Object");
        }
    }

    const checkIfTransactionExist = async () => {
        try {
            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionsCount();
            window.localStorage.setItem("transactionCount", transactionCount);
        } catch (error) {
            console.log(error);
            throw new Error("No Ethereum Object");
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert('please install metamask');
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', //21000 gwei,
                    value: parsedAmount._hex,

                }]
            });

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            setLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionsCount();
            setTransactionCount(transactionCount.toNumber());

            window.reload();
        } catch (error) {
            console.log(error);
            throw new Error("No Ethereum Object");
        }
    }

    useEffect(() => {
        checkIFWalletIsConnected();
        checkIfTransactionExist();
    }, [])

    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, handleChange, transactions,  loading, sendTransaction }}>
            {children}
        </TransactionContext.Provider>
    )
}


