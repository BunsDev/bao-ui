import Config from '@/bao/lib/config'
import Button from '@/components/Button'
import Input from '@/components/Input'
import Modal from '@/components/Modal'
import Typography from '@/components/Typography'
import { PoolType } from '@/contexts/Farms/types'
import useAllowance from '@/hooks/base/useAllowance'
import useBlockDiff from '@/hooks/base/useBlockDiff'
import useContract from '@/hooks/base/useContract'
import useTokenBalance from '@/hooks/base/useTokenBalance'
import useTransactionHandler from '@/hooks/base/useTransactionHandler'
import useEarnings from '@/hooks/farms/useEarnings'
import useFees from '@/hooks/farms/useFees'
import useStakedBalance from '@/hooks/farms/useStakedBalance'
import { useUserFarmInfo } from '@/hooks/farms/useUserFarmInfo'
import { Uni_v2_lp__factory } from '@/typechain/factories'
import type { Masterchef, Uni_v2_lp } from '@/typechain/index'
import { getDisplayBalance, getFullDisplayBalance } from '@/utils/numberFormat'
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, Contract, ethers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { default as React, useCallback, useState } from 'react'
import { FarmWithStakedValue } from './FarmList'
import { FeeModal } from './Modals'

interface StakeProps {
	lpContract: Uni_v2_lp
	lpTokenAddress: string // FIXME: this is passed in but we get it again
	pid: number
	max: BigNumber
	tokenName?: string
	poolType: PoolType
	ref?: string
	pairUrl: string
	onHide: () => void
}

export const Stake: React.FC<StakeProps> = ({ lpTokenAddress, pid, poolType, max, tokenName = '', pairUrl = '', onHide }) => {
	const { library } = useWeb3React()
	const [val, setVal] = useState('')
	const { pendingTx, handleTx } = useTransactionHandler()

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLInputElement>) => {
			setVal(e.currentTarget.value)
		},
		[setVal],
	)

	const handleSelectMax = useCallback(() => {
		setVal(getFullDisplayBalance(max))
	}, [setVal, max])

	const handleSelectHalf = useCallback(() => {
		setVal(formatUnits(max.div(2)))
	}, [max])

	const masterChefContract = useContract<Masterchef>('Masterchef')
	const allowance = useAllowance(lpTokenAddress, masterChefContract.address)

	const hideModal = useCallback(() => {
		onHide()
		setVal('')
	}, [onHide])

	return (
		<>
			<>
				<Modal.Body className='h-[120px]'>
					<div className='flex h-full flex-col items-center justify-center'>
						<div className='flex w-full flex-row'>
							<div className='float-left mb-1 flex w-full items-center justify-start gap-1'>
								<Typography variant='sm' className='text-text-200'>
									Fee:
								</Typography>
								<Typography variant='sm'>0.75%</Typography>
							</div>
							<div className='float-right mb-1 flex w-full items-center justify-end gap-1'>
								<Typography variant='sm' className='text-text-200'>
									Balance:
								</Typography>
								<Typography variant='sm'>
									{getDisplayBalance(max).toString()}{' '}
									<a href={pairUrl} target='_blank' rel='noopener noreferrer' className='hover:text-text-400'>
										{tokenName} <FontAwesomeIcon icon={faExternalLinkAlt} className='h-3 w-3' />
									</a>
								</Typography>
							</div>
						</div>
						<Input
							onSelectMax={handleSelectMax}
							onSelectHalf={handleSelectHalf}
							onChange={handleChange}
							value={val}
							max={formatUnits(max)}
							symbol={tokenName}
						/>
					</div>
				</Modal.Body>
			</>
			<Modal.Actions>
				{allowance && allowance.lte(0) ? (
					<>
						{pendingTx ? (
							<Button fullWidth disabled={true}>
								Approving {tokenName}
							</Button>
						) : (
							<Button
								fullWidth
								disabled={max.lte(0)}
								onClick={async () => {
									const signer = library.getSigner()
									const lpToken = Uni_v2_lp__factory.connect(lpTokenAddress, signer)
									// TODO- give the user a notice that we're approving max uint and instruct them how to change this value.
									const tx = lpToken.approve(masterChefContract.address, ethers.constants.MaxUint256)
									handleTx(tx, `Farms: Approve ${tokenName}`)
								}}
							>
								Approve {tokenName}
							</Button>
						)}
					</>
				) : (
					<>
						{poolType !== PoolType.ARCHIVED ? (
							<>
								{pendingTx ? (
									<Button fullWidth disabled={true}>
										{typeof pendingTx === 'string' ? (
											<Link href={`${Config.defaultRpc.blockExplorerUrls}/tx/${pendingTx}`} target='_blank' rel='noopener noreferrer'>
												Pending Transaction <FontAwesomeIcon icon={faExternalLinkAlt} />
											</Link>
										) : (
											'Pending Transaction'
										)}
									</Button>
								) : (
									<Button
										fullWidth
										disabled={!val || isNaN(val as any) || parseUnits(val).gt(max)}
										onClick={async () => {
											const refer = '0x0000000000000000000000000000000000000000'
											const stakeTx = masterChefContract.deposit(pid, ethers.utils.parseUnits(val.toString(), 18), refer)

											handleTx(stakeTx, `Farms: Deposit ${parseFloat(val).toFixed(4)} ${tokenName}`, () => hideModal())
										}}
									>
										Deposit {tokenName}
									</Button>
								)}
							</>
						) : (
							<Button
								fullWidth
								disabled={true}
								onClick={async () => {
									const stakeTx = masterChefContract.deposit(pid, ethers.utils.parseUnits(val.toString(), 18), '0x00')
									handleTx(stakeTx, `Farms: Deposit ${parseFloat(val).toFixed(4)} ${tokenName}`, () => hideModal())
								}}
							>
								Pool Archived
							</Button>
						)}
					</>
				)}
			</Modal.Actions>
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
	onHide: () => void
}

export const Unstake: React.FC<UnstakeProps> = ({ max, tokenName = '', pid, pairUrl = '', onHide }) => {
	const [val, setVal] = useState('')
	const { pendingTx, handleTx } = useTransactionHandler()

	const stakedBalance = useStakedBalance(pid)

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLInputElement>) => {
			setVal(e.currentTarget.value)
		},
		[setVal],
	)

	const handleSelectMax = useCallback(() => {
		setVal(getFullDisplayBalance(max))
	}, [setVal, max])

	const handleSelectHalf = useCallback(() => {
		setVal(formatUnits(max.div(2)))
	}, [max])

	const userInfo = useUserFarmInfo(pid)
	const blockDiff = useBlockDiff(userInfo)
	const fees = useFees(blockDiff)

	const masterChefContract = useContract<Masterchef>('Masterchef')

	const [showFeeModal, setShowFeeModal] = useState(false)

	const hideModal = useCallback(() => {
		onHide()
		setVal('')
	}, [onHide])

	return (
		<>
			<Modal.Body>
				<Typography variant='p'>
					Due to an issue with the masterFarmer contract, users cannot withdraw their staked assets as they would normally. Because the
					withdraw function is trying to call the harvest function, and rewards have ended, the transactions are failing. We are now using
					the emergencyWithdraw function to remedy this situation, which takes a fee of 25%. Upon withdrawal, this 25% fee will be sent to
					the treasury multisig. Guardians will refund users this fee on a frequent basis. If you have any questions, please reach out on{' '}
					<Link href='https://discord.gg/BW3P62vJXT' target='_blank' rel='noopener noreferrer' className='font-bold hover:text-text-400'>
						Discord
					</Link>
					. We are sorry for the inconvenience.
				</Typography>
				<div className='flex h-full flex-col items-center justify-center'>
					<div className='flex w-full flex-row'>
						<div className='mb-1 flex w-full items-center justify-center gap-1'>
							<Typography className='text-text-200'>Staked Balance:</Typography>
							<Typography className='font-bold'>
								{getDisplayBalance(max)} {tokenName}
							</Typography>
						</div>
					</div>
				</div>
			</Modal.Body>
			<Modal.Actions>
				<>
					{pendingTx ? (
						<Button disabled={true}>
							{typeof pendingTx === 'string' ? (
								<Link href={`${Config.defaultRpc.blockExplorerUrls}/tx/${pendingTx}`} target='_blank' rel='noopener noreferrer'>
									<a>
										Pending Transaction <FontAwesomeIcon icon={faExternalLinkAlt} />
									</a>
								</Link>
							) : (
								'Pending Transaction'
							)}
						</Button>
					) : (
						<Button
							disabled={stakedBalance.eq(BigNumber.from(0))}
							onClick={async () => {
								const unstakeTx = masterChefContract.emergencyWithdraw(pid)
								handleTx(unstakeTx, `Farms: Withdraw ${getDisplayBalance(max)} ${tokenName}`, () => hideModal())
							}}
						>
							Withdraw {tokenName}
						</Button>
					)}
				</>
			</Modal.Actions>
			<FeeModal pid={pid} show={showFeeModal} onHide={() => setShowFeeModal(false)} />
		</>
	)
}

interface RewardsProps {
	pid: number
}

export const Rewards: React.FC<RewardsProps> = ({ pid }) => {
	const earnings = useEarnings(pid)
	const { pendingTx, handleTx } = useTransactionHandler()
	const masterChefContract = useContract<Masterchef>('Masterchef')

	return (
		<>
			<Modal.Body className='h-[120px]'>
				<div className='flex h-full flex-col items-center justify-center'>
					<div className='flex items-center justify-center'>
						<div className='flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border-0 bg-primary-300'>
							<Image src='/images/tokens/BAO.png' alt='ETH' width={32} height={32} className='m-auto' />
						</div>
						<div className='ml-2'>
							<Typography variant='xl' className='font-medium'>
								{getDisplayBalance(earnings)}
							</Typography>
						</div>
					</div>
				</div>
			</Modal.Body>
			<Modal.Actions>
				<>
					{pendingTx ? (
						<Button fullWidth disabled={true}>
							{typeof pendingTx === 'string' ? (
								<Link href={`${Config.defaultRpc.blockExplorerUrls}/tx/${pendingTx}`} target='_blank' rel='noopener noreferrer'>
									<a>
										Pending Transaction <FontAwesomeIcon icon={faExternalLinkAlt} />
									</a>
								</Link>
							) : (
								'Pending Transaction'
							)}
						</Button>
					) : (
						<Button
							fullWidth
							disabled={!earnings.toNumber()}
							onClick={async () => {
								const harvestTx = masterChefContract.claimReward(pid)

								handleTx(harvestTx, `Farms: Harvest ${getDisplayBalance(earnings)} BAO`)
							}}
						>
							Harvest BAO
						</Button>
					)}
				</>
			</Modal.Actions>
		</>
	)
}

interface ActionProps {
	lpContract: Contract
	lpTokenAddress: string
	pid: number
	max: BigNumber
	tokenName?: string
	poolType: PoolType
	ref?: string
	pairUrl: string
	onHide: () => void
	farm: FarmWithStakedValue
	operation: string
}

const Actions: React.FC<ActionProps> = ({ farm, onHide, operation }) => {
	const { pid } = farm
	const lpContract = useContract<Uni_v2_lp>('Uni_v2_lp', farm.lpTokenAddress)
	const tokenBalance = useTokenBalance(farm.lpTokenAddress)
	const stakedBalance = useStakedBalance(pid)

	return (
		<div>
			{operation === 'Stake' && (
				<Stake
					lpContract={lpContract}
					lpTokenAddress={farm.lpTokenAddress}
					pid={farm.pid}
					tokenName={farm.lpToken.toUpperCase()}
					poolType={farm.poolType}
					max={tokenBalance}
					pairUrl={farm.pairUrl}
					onHide={onHide}
				/>
			)}
			{operation === 'Unstake' && (
				<Unstake
					farm={farm}
					pid={farm.pid}
					tokenName={farm.lpToken.toUpperCase()}
					max={stakedBalance}
					pairUrl={farm.pairUrl}
					lpTokenAddress={farm.lpTokenAddress}
					onHide={onHide}
				/>
			)}
			{operation === 'Rewards' && <Rewards pid={farm.pid} />}
		</div>
	)
}

export default Actions
