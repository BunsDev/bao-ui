import { Contract } from 'web3-eth-contract'

export enum IndexType {
  PORTFOLIO = 'portfolio',
  YIELD = 'yield',
  METAGOVERNANCE = 'metagovernance',
  TEST = 'test',
}

export interface Nest {
  nid: number
  name: string
  nestContract: Contract
  nestToken: string
  nestTokenAddress: string
  icon: string
  id: string
  tokenSymbol: string
  indexType?: IndexType
}

export interface NestsContext {
  nests: Nest[]
}
