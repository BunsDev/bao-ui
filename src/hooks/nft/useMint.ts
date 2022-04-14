import { useWeb3React } from '@web3-react/core'
import {
  getBaoSwapNFTContract,
  getElderContract,
  getNFTWhitelistClaimed,
  mintBaoSwap,
  mintElder
} from 'bao/utils'
import useBao from 'hooks/base/useBao'
import useBlock from 'hooks/base/useBlock'
import useTransactionProvider from 'hooks/base/useTransactionProvider'
import { useCallback, useEffect, useState } from 'react'

export const useElderMint = () => {
  const { account } = useWeb3React()
  const bao = useBao()
  const nftContract = getElderContract(bao)

  const handleMint = useCallback(async () => {
    const txHash = await mintElder(nftContract, account)
    console.log(txHash)
  }, [account, bao])

  return { onMintElder: handleMint }
}

export const useBaoSwapMint = () => {
  const { account } = useWeb3React()
  const bao = useBao()
  const nftContract = getBaoSwapNFTContract(bao)

  const handleMint = useCallback(async () => {
    const txHash = await mintBaoSwap(nftContract, account)
    console.log(txHash)
  }, [account, bao])

  return { onMintBaoSwap: handleMint }
}

export const useElderClaimedCheck = () => {
  const [isClaimed, setIsClaimed] = useState<any | undefined>()
  const { account } = useWeb3React()
  const bao = useBao()
  const block = useBlock()
  const { transactions } = useTransactionProvider()

  const fetchWhitelistClaimed = useCallback(async () => {
    const _isClaimed = await getNFTWhitelistClaimed(
      getElderContract(bao),
      account,
    )
    setIsClaimed(_isClaimed)
  }, [bao, account])

  useEffect(() => {
    if (account && bao) {
      fetchWhitelistClaimed()
    }
  }, [bao, account, block, transactions])

  return isClaimed
}

export const useBaoSwapClaimedCheck = () => {
  const [isClaimed, setIsClaimed] = useState<any | undefined>()
  const { account } = useWeb3React()
  const bao = useBao()
  const block = useBlock()
  const { transactions } = useTransactionProvider()

  const fetchWhitelistClaimed = useCallback(async () => {
    const _isClaimed = await getNFTWhitelistClaimed(
      getBaoSwapNFTContract(bao),
      account,
    )
    setIsClaimed(_isClaimed)
  }, [bao, account])

  useEffect(() => {
    if (account && bao) {
      fetchWhitelistClaimed()
    }
  }, [bao, account, block, transactions])

  return isClaimed
}
