import { TransactionReceipt } from '@ethersproject/providers'
import { useState } from 'react'
import useTransactionProvider from './useTransactionProvider'

const useTransactionHandler = () => {
  const { onAddTransaction, onTxReceipt } = useTransactionProvider()
  const [pendingTx, setPendingTx] = useState<string | boolean>(false)
  const [txSuccess, setTxSuccess] = useState<boolean>(false)

  const clearPendingTx = () => {
    setPendingTx(false)
  }

  const handlePendingTx = (hash: string, description: string) => {
    onAddTransaction({
      hash,
      description,
    })
    setPendingTx(hash)
  }

  const handleReceipt = (receipt: TransactionReceipt) => {
    onTxReceipt(receipt)
    setPendingTx(false)
  }

  const handleTx = (tx: any, description: string, cb?: () => void) => {
    tx.on('transactionHash', (txHash: string) =>
      handlePendingTx(txHash, description),
    )
      .on('receipt', (receipt: TransactionReceipt) => {
        handleReceipt(receipt)
        if (cb) cb()
        setTxSuccess(false)
        if (receipt.status === 1) {
          setTxSuccess(true)
        }
        return txSuccess
      })
      .on('error', clearPendingTx)
    setPendingTx(true)
  }

  return {
    pendingTx,
    handleTx,
    txSuccess,
  }
}

export default useTransactionHandler
