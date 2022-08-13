import Config from '@/bao/lib/config'
import { approvev2, getMasterChefContract } from '@/bao/utils'
import { BalanceContent, BalanceImage, BalanceSpacer, BalanceText, BalanceValue, BalanceWrapper } from '@/components/Balance'
import { ButtonStack, SubmitButton } from '@/components/Button'
import { QuestionIcon } from '@/components/Icon'
import { AssetLabel, LabelEnd, LabelStack, LabelStart, MaxLabel } from '@/components/Label'
import { SpinnerLoader } from '@/components/Loader'
import TokenInput from '@/components/TokenInput'
import { PoolType } from '@/contexts/Farms/types'
import useAllowance from '@/hooks/base/useAllowance'
import useBao from '@/hooks/base/useBao'
import useBlockDiff from '@/hooks/base/useBlockDiff'
import useTransactionHandler from '@/hooks/base/useTransactionHandler'
import useEarnings from '@/hooks/farms/useEarnings'
import useFees from '@/hooks/farms/useFees'
import useStakedBalance from '@/hooks/farms/useStakedBalance'
import { useUserFarmInfo } from '@/hooks/farms/useUserFarmInfo'
import { exponentiate, getDisplayBalance, getFullDisplayBalance } from '@/utils/numberFormat'
import { faExternalLinkAlt, faQuestionCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useWeb3React } from '@web3-react/core'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'
import Image from 'next/image'
import Link from 'next/link'
import { default as React, useCallback, useMemo, useState } from 'react'
import { Col, Modal, Row } from 'react-bootstrap'
import { Contract } from 'web3-eth-contract'
import { FarmWithStakedValue } from './FarmList'
import { FeeModal } from './Modals'
import { EarningsWrapper, FarmModalBody } from './styles'

interface StakeProps {
	lpContract: Contract
	lpTokenAddress: string
	pid: number
	max: BigNumber
	tokenName?: string
	poolType: PoolType
	ref?: string
	pairUrl: string
	onHide?: () => void
}

export const Stake: React.FC<StakeProps> = ({ lpContract, pid, poolType, max, tokenName = '', pairUrl = '', onHide }) => {
	const bao = useBao()
	const { account } = useWeb3React()
	const [val, setVal] = useState('')
	const { pendingTx, handleTx } = useTransactionHandler()

	const fullBalance = useMemo(() => {
		return getFullDisplayBalance(max)
	}, [max])

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLInputElement>) => {
			setVal(e.currentTarget.value)
		},
		[setVal],
	)

	const handleSelectMax = useCallback(() => {
		setVal(fullBalance)
	}, [fullBalance, setVal])

	const handleSelectHalf = useCallback(() => {
		setVal(
			max
				.div(10 ** 18)
				.div(2)
				.toString(),
		)
	}, [fullBalance, setVal])

	const allowance = useAllowance(lpContract)

	const masterChefContract = getMasterChefContract(bao)

	const hideModal = useCallback(() => {
		onHide()
		setVal('')
	}, [onHide])

	return (
		<>
			<FarmModalBody>
				<BalanceWrapper>
					<Col xs={4}>
						<LabelStart>
							<MaxLabel>Fee:</MaxLabel>
							<AssetLabel>0.75%</AssetLabel>
						</LabelStart>
					</Col>
					<Col xs={8}>
						<LabelEnd>
							<LabelStack>
								<MaxLabel>Balance:</MaxLabel>
								<AssetLabel>
									{fullBalance}
									<Link href={pairUrl} target='_blank' rel='noopener noreferrer'>
										<a>
											{' '}
											{tokenName} <FontAwesomeIcon icon={faExternalLinkAlt} style={{ height: '.75rem' }} />
										</a>
									</Link>
								</AssetLabel>
							</LabelStack>
						</LabelEnd>
					</Col>
				</BalanceWrapper>
				<Row>
					<Col xs={12}>
						<TokenInput
							onSelectMax={handleSelectMax}
							onSelectHalf={handleSelectHalf}
							onChange={handleChange}
							value={val}
							max={fullBalance}
							symbol={tokenName}
						/>
					</Col>
				</Row>
			</FarmModalBody>
			<Modal.Footer>
				<ButtonStack>
					{!allowance.toNumber() ? (
						<>
							{pendingTx ? (
								<SubmitButton disabled={true}>Approving {tokenName}</SubmitButton>
							) : (
								<SubmitButton
									onClick={async () => {
										handleTx(approvev2(lpContract, masterChefContract, account), `Approve ${tokenName}`)
									}}
								>
									Approve {tokenName}
								</SubmitButton>
							)}
						</>
					) : (
						<>
							{poolType !== PoolType.ARCHIVED ? (
								<>
									{pendingTx ? (
										<SubmitButton disabled={true}>
											{typeof pendingTx === 'string' ? (
												<a href={`${Config.defaultRpc.blockExplorerUrls}/tx/${pendingTx}`} target='_blank' rel='noreferrer'>
													Pending Transaction <FontAwesomeIcon icon={faExternalLinkAlt} />
												</a>
											) : (
												'Pending Transaction'
											)}
										</SubmitButton>
									) : (
										<SubmitButton
											disabled={!val || !bao || isNaN(val as any) || parseFloat(val) > max.toNumber()}
											onClick={async () => {
												const stakeTx = masterChefContract.methods
													.deposit(pid, ethers.utils.parseUnits(val.toString(), 18))
													.send({ from: account })

												handleTx(stakeTx, `Deposit ${parseFloat(val).toFixed(4)} ${tokenName}`, () => hideModal())
											}}
										>
											Deposit {tokenName}
										</SubmitButton>
									)}
								</>
							) : (
								<SubmitButton
									disabled={true}
									onClick={async () => {
										const stakeTx = masterChefContract.methods
											.deposit(pid, ethers.utils.parseUnits(val.toString(), 18))
											.send({ from: account })
										handleTx(stakeTx, `Deposit ${parseFloat(val).toFixed(4)} ${tokenName}`, () => hideModal())
									}}
								>
									Pool Archived
								</SubmitButton>
							)}
						</>
					)}
				</ButtonStack>
			</Modal.Footer>
		</>
	)
}

interface UnstakeProps {
	farm: FarmWithStakedValue
	max: BigNumber
	tokenName?: string
	pid: number
	ref?: string
	pairUrl: string
	lpTokenAddress: string
	onHide?: () => void
}

export const Unstake: React.FC<UnstakeProps> = ({ max, tokenName = '', pid = null, pairUrl = '', onHide }) => {
	const bao = useBao()
	const { account } = useWeb3React()
	const [val, setVal] = useState('')
	const { pendingTx, handleTx } = useTransactionHandler()

	const stakedBalance = useStakedBalance(pid)

	const fullBalance = useMemo(() => {
		return getFullDisplayBalance(max)
	}, [max])

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLInputElement>) => {
			setVal(e.currentTarget.value)
		},
		[setVal],
	)

	const handleSelectMax = useCallback(() => {
		setVal(fullBalance)
	}, [fullBalance, setVal])

	const handleSelectHalf = useCallback(() => {
		setVal(
			max
				.div(10 ** 18)
				.div(2)
				.toString(),
		)
	}, [fullBalance, setVal])

	const userInfo = useUserFarmInfo(pid)
	const blockDiff = useBlockDiff(userInfo)
	const fees = useFees(blockDiff)

	const masterChefContract = getMasterChefContract(bao)

	const [showFeeModal, setShowFeeModal] = useState(false)

	const hideModal = useCallback(() => {
		onHide()
		setVal('')
	}, [onHide])

	return (
		<>
			<FarmModalBody>
				<BalanceWrapper>
					<Col xs={4}>
						<LabelStart>
							<LabelStack>
								<MaxLabel>Fee:</MaxLabel>{' '}
								<AssetLabel>
									{fees ? `${(fees * 100).toFixed(2)}%` : <SpinnerLoader />}{' '}
									<span>
										<QuestionIcon icon={faQuestionCircle} onClick={() => setShowFeeModal(true)} />
									</span>
								</AssetLabel>
							</LabelStack>
						</LabelStart>
					</Col>
					<Col xs={8}>
						<LabelEnd>
							<LabelStack>
								<MaxLabel>Balance:</MaxLabel>
								<AssetLabel>
									{getDisplayBalance(fullBalance, 0)}{' '}
									<a href={pairUrl} rel='noopener noreferrer'>
										{' '}
										{tokenName} <FontAwesomeIcon icon={faExternalLinkAlt} style={{ height: '.75rem' }} />
									</a>
								</AssetLabel>
							</LabelStack>
						</LabelEnd>
					</Col>
				</BalanceWrapper>
				<Row>
					<Col xs={12}>
						<TokenInput
							onSelectMax={handleSelectMax}
							onSelectHalf={handleSelectHalf}
							onChange={handleChange}
							value={val}
							max={fullBalance}
							symbol={tokenName}
						/>
					</Col>
				</Row>
			</FarmModalBody>
			<Modal.Footer>
				<ButtonStack>
					<>
						{pendingTx ? (
							<SubmitButton disabled={true}>
								{typeof pendingTx === 'string' ? (
									<a href={`${Config.defaultRpc.blockExplorerUrls}/tx/${pendingTx}`} target='_blank' rel='noreferrer'>
										Pending Transaction <FontAwesomeIcon icon={faExternalLinkAlt} />
									</a>
								) : (
									'Pending Transaction'
								)}
							</SubmitButton>
						) : (
							<SubmitButton
								disabled={
									!val || !bao || isNaN(val as any) || parseFloat(val) > parseFloat(fullBalance) || stakedBalance.eq(new BigNumber(0))
								}
								onClick={async () => {
									const amount = val && isNaN(val as any) ? exponentiate(val, 18) : new BigNumber(0).toFixed(4)

									const unstakeTx = masterChefContract.methods.withdraw(pid, ethers.utils.parseUnits(val, 18)).send({ from: account })

									handleTx(unstakeTx, `Withdraw ${amount} ${tokenName}`, () => hideModal())
								}}
							>
								Withdraw {tokenName}
							</SubmitButton>
						)}
					</>
				</ButtonStack>
			</Modal.Footer>
			<FeeModal pid={pid} show={showFeeModal} onHide={() => setShowFeeModal(false)} />
		</>
	)
}

interface RewardsProps {
	pid: number
}

export const Rewards: React.FC<RewardsProps> = ({ pid }) => {
	const bao = useBao()
	const earnings = useEarnings(pid)
	const { account } = useWeb3React()
	const { pendingTx, handleTx } = useTransactionHandler()
	const masterChefContract = getMasterChefContract(bao)

	return (
		<>
			<FarmModalBody>
				<EarningsWrapper>
					<BalanceContent>
						<BalanceImage>
							<Image src='/images/tokens/BAO.png' width={32} height={32} alt='BAO' />
						</BalanceImage>
						<BalanceSpacer />
						<BalanceText>
							<BalanceValue>{getDisplayBalance(earnings)}</BalanceValue>
						</BalanceText>
					</BalanceContent>
				</EarningsWrapper>
			</FarmModalBody>
			<Modal.Footer>
				<ButtonStack>
					<>
						{pendingTx ? (
							<SubmitButton disabled={true}>
								{typeof pendingTx === 'string' ? (
									<a href={`${Config.defaultRpc.blockExplorerUrls}/tx/${pendingTx}`} target='_blank' rel='noreferrer'>
										Pending Transaction <FontAwesomeIcon icon={faExternalLinkAlt} />
									</a>
								) : (
									'Pending Transaction'
								)}
							</SubmitButton>
						) : (
							<SubmitButton
								disabled={!earnings.toNumber()}
								onClick={async () => {
									const harvestTx = masterChefContract.methods.claimReward(pid).send({ from: account })

									handleTx(harvestTx, `Harvest ${getDisplayBalance(earnings)} BAO`)
								}}
							>
								Harvest BAO
							</SubmitButton>
						)}
					</>
				</ButtonStack>
			</Modal.Footer>
		</>
	)
}
