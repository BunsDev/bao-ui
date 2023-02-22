import Config from '@/bao/lib/config'
import { ActiveSupportedVault } from '@/bao/lib/types'
import Badge from '@/components/Badge'
import Button, { NavButtons } from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import { ListHeader } from '@/components/List'
import { PageLoader } from '@/components/Loader'
import { StatBlock } from '@/components/Stats'
import Tooltipped from '@/components/Tooltipped'
import Typography from '@/components/Typography'
import useBao from '@/hooks/base/useBao'
import useContract from '@/hooks/base/useContract'
import useTransactionHandler from '@/hooks/base/useTransactionHandler'
import useBasketInfo from '@/hooks/baskets/useBasketInfo'
import useBaskets from '@/hooks/baskets/useBaskets'
import useComposition from '@/hooks/baskets/useComposition'
import { AccountLiquidity, useAccountLiquidity } from '@/hooks/vaults/useAccountLiquidity'
import { Balance, useAccountBalances, useBorrowBalances, useSupplyBalances } from '@/hooks/vaults/useBalances'
import { useExchangeRates } from '@/hooks/vaults/useExchangeRates'
import useHealthFactor from '@/hooks/vaults/useHealthFactor'
import { useVaultPrices } from '@/hooks/vaults/usePrices'
import { useAccountVaults, useVaults } from '@/hooks/vaults/useVaults'
import type { Comptroller } from '@/typechain/index'
import { providerKey } from '@/utils/index'
import { decimate, exponentiate, getDisplayBalance, sqrt } from '@/utils/numberFormat'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Switch } from '@headlessui/react'
import { Accordion, AccordionBody, AccordionHeader } from '@material-tailwind/react/components/Accordion'
import { useQuery } from '@tanstack/react-query'
import { useWeb3React } from '@web3-react/core'
import classNames from 'classnames'
import { BigNumber, FixedNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import React, { useCallback, useMemo, useState } from 'react'
import { isDesktop } from 'react-device-detect'
import VaultBorrowModal from './Modals/BorrowModal'
import VaultSupplyModal from './Modals/SupplyModal'
import { VaultDetails } from './Stats'
import VaultButton from './VaultButton'

// FIXME: these components should all be using ethers.BigNumber instead of js float math

export const VaultList = ({ vaultName }: VaultListProps) => {
	const bao = useBao()
	const { account, library, chainId } = useWeb3React()
	const _vaults = useVaults(vaultName)
	const accountBalances = useAccountBalances(vaultName)
	const accountVaults = useAccountVaults(vaultName)
	const accountLiquidity = useAccountLiquidity(vaultName)
	const supplyBalances = useSupplyBalances(vaultName)
	const borrowBalances = useBorrowBalances(vaultName)
	const { exchangeRates } = useExchangeRates(vaultName)
	const balances = useAccountBalances(vaultName)
	const { prices } = useVaultPrices(vaultName)

	const [val, setVal] = useState<string>('')
	const operations = ['Mint', 'Repay']
	const [operation, setOperation] = useState(operations[0])

	const collateralVaults = useMemo(() => {
		if (!(_vaults && supplyBalances)) return
		return _vaults
			.filter(vault => !vault.isSynth)
			.sort((a, b) => {
				void a
				return supplyBalances.find(balance => balance.address.toLowerCase() === b.vaultAddress.toLowerCase()).balance.gt(0) ? 1 : 0
			})
	}, [_vaults, supplyBalances])

	const synthVaults = useMemo(() => {
		if (!(_vaults && borrowBalances)) return
		return _vaults
			.filter(vault => vault.isSynth)
			.sort((a, b) => {
				void a
				return borrowBalances.find(balance => balance.address.toLowerCase() === b.vaultAddress.toLowerCase()).balance.gt(0) ? 1 : 0
			})
	}, [_vaults, borrowBalances])

	const [showBorrowModal, setShowBorrowModal] = useState(false)
	const [isOpen, setIsOpen] = useState(false)

	const borrowed = useMemo(
		() => synthVaults && borrowBalances.find(balance => balance.address === synthVaults[0].vaultAddress).balance,
		[borrowBalances, synthVaults],
	)

	const handleOpen = () => {
		!isOpen ? setIsOpen(true) : setIsOpen(false)
		showBorrowModal && setIsOpen(true)
	}

	const accountBal = synthVaults && accountBalances && accountBalances.find(balance => balance.address === synthVaults[0].underlyingAddress)
	const accountBalance = accountBal !== undefined ? accountBal.balance : BigNumber.from(0)

	const healthFactor = useHealthFactor(vaultName)

	const borrowLimit =
		accountLiquidity && !accountLiquidity.usdBorrow.eq(0)
			? accountLiquidity.usdBorrow.div(accountLiquidity.usdBorrowable.add(accountLiquidity.usdBorrow)).mul(100)
			: BigNumber.from(0)

	const healthFactorColor = (healthFactor: BigNumber) => {
		const c = healthFactor.eq(0)
			? `${(props: any) => props.theme.color.text[100]}`
			: healthFactor.lte(parseUnits('1.25'))
			? '#e32222'
			: healthFactor.lt(parseUnits('1.55'))
			? '#ffdf19'
			: '#45be31'
		return c
	}

	const { data: maxMintable } = useQuery(
		['@/hooks/base/useTokenBalance', providerKey(library, account, chainId)],
		async () => {
			const _maxMintable = await synthVaults[0].underlyingContract.balanceOf(synthVaults[0].vaultAddress)
			return _maxMintable
		},
		{
			placeholderData: BigNumber.from(0),
		},
	)

	const supply = useMemo(
		() =>
			supplyBalances &&
			synthVaults &&
			supplyBalances.find(balance => balance.address.toLowerCase() === synthVaults[0].vaultAddress.toLowerCase()) &&
			exchangeRates &&
			synthVaults &&
			exchangeRates[synthVaults[0].vaultAddress]
				? decimate(
						supplyBalances
							.find(balance => balance.address.toLowerCase() === synthVaults[0].vaultAddress.toLowerCase())
							.balance.mul(exchangeRates[synthVaults[0].vaultAddress]),
				  )
				: BigNumber.from(0),
		[supplyBalances, exchangeRates, synthVaults],
	)

	let _imfFactor = synthVaults && synthVaults[0].imfFactor
	if (accountLiquidity) {
		const _sqrt = sqrt(supply)
		const num = exponentiate(parseUnits('1.1'))
		const denom = synthVaults && decimate(synthVaults[0].imfFactor.mul(_sqrt).add(parseUnits('1')))
		_imfFactor = synthVaults && num.div(denom)
	}

	let withdrawable = BigNumber.from(0)
	if (synthVaults && _imfFactor.gt(synthVaults[0].collateralFactor) && synthVaults[0].price.gt(0)) {
		if (synthVaults[0].collateralFactor.mul(synthVaults[0].price).gt(0)) {
			withdrawable =
				accountLiquidity &&
				exponentiate(accountLiquidity.usdBorrowable).div(decimate(synthVaults[0].collateralFactor.mul(synthVaults[0].price)))
		} else {
			withdrawable = accountLiquidity && exponentiate(accountLiquidity.usdBorrowable).div(decimate(_imfFactor).mul(synthVaults[0].price))
		}
	}

	const max = () => {
		switch (operation) {
			case 'Mint':
				return prices && accountLiquidity && synthVaults[0].price.gt(0)
					? BigNumber.from(
							FixedNumber.from(formatUnits(accountLiquidity && accountLiquidity.usdBorrowable)).divUnsafe(
								FixedNumber.from(formatUnits(synthVaults[0].price)),
							),
					  )
					: BigNumber.from(0)
			case 'Repay':
				if (borrowBalances && balances) {
					const borrowBalance = borrowBalances.find(
						_balance => _balance.address.toLowerCase() === synthVaults[0].vaultAddress.toLowerCase(),
					).balance
					const walletBalance = balances.find(
						_balance => _balance.address.toLowerCase() === synthVaults[0].underlyingAddress.toLowerCase(),
					).balance
					return walletBalance.lt(borrowBalance) ? walletBalance : borrowBalance
				} else {
					return BigNumber.from(0)
				}
		}
	}

	const maxLabel = () => {
		switch (operation) {
			case 'Mint':
				return 'Max Mint'
			case 'Repay':
				return 'Max Repay'
		}
	}

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLInputElement>) => {
			if (e.currentTarget.value.length < 20) setVal(e.currentTarget.value)
		},
		[setVal],
	)

	const change = val ? decimate(BigNumber.from(val).mul(synthVaults[0].price)) : BigNumber.from(0)
	const borrow = accountLiquidity ? accountLiquidity.usdBorrow : BigNumber.from(0)
	const newBorrow = borrow ? borrow.sub(change.gt(0) ? change : 0) : BigNumber.from(0)
	const borrowable = accountLiquidity ? decimate(accountLiquidity.usdBorrow).add(accountLiquidity.usdBorrowable) : BigNumber.from(0)
	const newBorrowable =
		synthVaults && decimate(borrowable).add(BigNumber.from(parseUnits(formatUnits(change, 36 - synthVaults[0].underlyingDecimals))))

	const synthBalance = useMemo(
		() =>
			synthVaults && balances && balances.find(_balance => _balance.address === synthVaults[0].underlyingAddress)
				? balances.find(_balance => _balance.address === synthVaults[0].underlyingAddress).balance
				: 0,
		[balances, synthVaults],
	)

	return (
		<>
			{collateralVaults &&
			synthVaults &&
			accountBalances &&
			accountLiquidity &&
			accountVaults &&
			supplyBalances &&
			borrowBalances &&
			exchangeRates ? (
				<>
					<div className='mb-4 flex h-fit w-fit flex-row gap-4 rounded border-0 bg-primary-100 p-3'>
						<FontAwesomeIcon icon={faArrowLeft} />
					</div>
					<div className='mb-4 flex w-full flex-row gap-4 rounded border-0 bg-primary-100 p-3'>
						<div className='mx-auto my-0 flex w-full flex-row items-center text-start align-middle'>
							<Image
								src={`/images/tokens/${synthVaults[0].icon}`}
								alt={`${synthVaults[0].underlyingSymbol}`}
								width={32}
								height={32}
								className='inline-block select-none'
							/>
							<span className='inline-block text-left align-middle'>
								<Typography className='ml-2 text-lg font-bold leading-5'>{synthVaults[0].underlyingSymbol}</Typography>
							</span>
						</div>
						<div className='mx-auto my-0 flex w-full flex-row items-center justify-end text-end align-middle'>
							<Typography className='ml-2 inline-block !text-lg leading-5'>{getDisplayBalance(synthVaults[0].borrowApy)}%</Typography>
							<Typography className='ml-1 inline-block !text-lg text-text-100'>APY</Typography>
						</div>
					</div>

					{account && (
						<>
							<div className='flex w-full flex-row'>
								<Typography variant='lg' className='m-auto mb-2 justify-center font-bold'>
									Dashboard
								</Typography>
							</div>
							<div className='mb-4 flex flex-row gap-4'>
								<div className='flex w-1/2 flex-col'>
									<StatBlock
										className='mb-4'
										stats={[
											{
												label: 'Your Collateral USD',
												value: `$${
													bao && account && accountLiquidity
														? getDisplayBalance(decimate(BigNumber.from(accountLiquidity.usdSupply.toString())), 18, 2)
														: 0
												}`,
											},
											{
												label: 'Your Debt',
												value: `${accountLiquidity ? getDisplayBalance(borrowed) : 0} ${synthVaults[0].underlyingSymbol}`,
											},
											{
												label: 'Your Debt USD',
												value: `$${accountLiquidity ? getDisplayBalance(decimate(accountLiquidity.usdBorrow), 18, 2) : 0}`,
											},
											{
												label: 'Debt Limit Remaining',
												value: `$${getDisplayBalance(
													accountLiquidity ? accountLiquidity.usdBorrowable : BigNumber.from(0),
												)} ➜ $${getDisplayBalance(accountLiquidity ? accountLiquidity.usdBorrowable.add(change) : BigNumber.from(0))}`,
											},
											{
												// FIXME: Fix this for when a users current borrow amount is zero
												label: 'Debt Limit Used',
												value: `${getDisplayBalance(
													!borrowable.eq(0) ? exponentiate(borrow).div(borrowable).mul(100) : 0,
													18,
													2,
												)}% ➜ ${getDisplayBalance(!newBorrowable.eq(0) ? newBorrow.div(newBorrowable).mul(100) : 0, 18, 2)}%`,
											},
											{
												label: `Debt Health`,
												value: `${
													healthFactor &&
													healthFactor &&
													(healthFactor.lte(0) ? (
														'-'
													) : parseFloat(formatUnits(healthFactor)) > 10000 ? (
														<p>
															{'>'} 10000 <Tooltipped content={`Your health factor is ${formatUnits(healthFactor)}.`} />
														</p>
													) : (
														getDisplayBalance(healthFactor)
													))
												}`,
											},
										]}
									/>
								</div>
								<div className='flex w-1/2 flex-col'>
									<Card.Options className='mt-0'>
										<NavButtons options={operations} active={operation} onClick={setOperation} />
									</Card.Options>
									<Card.Body>
										<div className='mb-4 flex flex-col items-center justify-center'>
											<div className='flex w-full flex-row'>
												<div className='float-left mb-1 flex w-full items-center justify-start gap-1'>
													<Typography variant='sm' className='text-text-200'>
														Wallet:
													</Typography>
													<Typography variant='sm'>{`${getDisplayBalance(synthBalance)}`}</Typography>
												</div>
												<div className='float-left mb-1 flex w-full items-center justify-end gap-1'>
													<Typography variant='sm' className='text-text-200'>
														{`${maxLabel()}:`}
													</Typography>
													<Typography variant='sm'>{`${getDisplayBalance(max(), synthVaults[0].underlyingDecimals)} ${
														synthVaults[0].underlyingSymbol
													}`}</Typography>
												</div>
											</div>
											<Input
												value={val}
												onChange={handleChange}
												onSelectMax={() => setVal(formatUnits(max(), synthVaults[0].underlyingDecimals))}
												label={
													<div className='flex flex-row items-center pl-2 pr-4'>
														<div className='flex w-6 justify-center'>
															<Image
																src={`/images/tokens/${synthVaults[0].icon}`}
																width={32}
																height={32}
																alt={synthVaults[0].symbol}
																className='block h-6 w-6 align-middle'
															/>
														</div>
													</div>
												}
											/>
										</div>
									</Card.Body>
									<Card.Actions>
										<VaultButton
											vaultName={vaultName}
											operation={operation}
											asset={synthVaults[0]}
											val={val ? parseUnits(val, synthVaults[0].underlyingDecimals) : BigNumber.from(0)}
											isDisabled={
												!val ||
												(val && parseUnits(val, synthVaults[0].underlyingDecimals).gt(max())) ||
												// FIXME: temporarily limit minting/borrowing to 5k baoUSD.
												(val &&
													vaultName === 'baoUSD' &&
													parseUnits(val, synthVaults[0].underlyingDecimals).lt(parseUnits('5000')) &&
													operation === 'Mint')
											}
										/>
									</Card.Actions>
								</div>
							</div>
						</>
					)}

					<StatBlock
						className='mb-4'
						label='Vault Info'
						stats={[
							{
								label: `Current ${synthVaults[0].underlyingSymbol} Price`,
								value: `$${getDisplayBalance(synthVaults[0].price)}`,
							},
							{
								label: 'Total Debt',
								value: `${getDisplayBalance(synthVaults[0].totalBorrows)} ${synthVaults[0].underlyingSymbol}`,
							},
							{
								label: 'Total Debt USD',
								value: `$${getDisplayBalance(
									decimate(synthVaults[0].totalBorrows.mul(synthVaults[0].price)),
									synthVaults[0].underlyingDecimals,
								)}`,
							},
							{
								label: 'Total Collateral USD',
								value: `-`,
							},
							{
								label: 'Minimum Borrow',
								value: `5000 baoUSD`,
							},
							{
								label: 'Max Mintable',
								value: `${getDisplayBalance(maxMintable ? maxMintable : 0)} ${synthVaults[0].underlyingSymbol}`,
							},
						]}
					/>

					<div className='flex w-full flex-col'>
						<Typography variant='lg' className='text-center font-bold'>
							Supply
						</Typography>
						<ListHeader headers={['Asset', 'Wallet', 'Underlying APY', 'Liquidity']} className='mr-10' />
						{collateralVaults.map((vault: ActiveSupportedVault) => (
							<VaultListItemCollateral
								vault={vault}
								vaultName={vaultName}
								accountBalances={accountBalances}
								accountVaults={accountVaults}
								supplyBalances={supplyBalances}
								borrowBalances={borrowBalances}
								exchangeRates={exchangeRates}
								key={vault.vaultAddress}
							/>
						))}
					</div>

					<VaultBorrowModal
						vaultName={vaultName}
						asset={synthVaults[0]}
						show={showBorrowModal}
						onHide={() => {
							setShowBorrowModal(false)
							setIsOpen(true)
						}}
					/>
				</>
			) : (
				<PageLoader block />
			)}
		</>
	)
}

const VaultListItemCollateral: React.FC<VaultListItemProps> = ({
	vault,
	vaultName,
	accountBalances,
	accountVaults,
	supplyBalances,
	borrowBalances,
	exchangeRates,
}: VaultListItemProps) => {
	const [showSupplyModal, setShowSupplyModal] = useState(false)
	const { account } = useWeb3React()
	const { handleTx } = useTransactionHandler()
	const comptroller = useContract<Comptroller>('Comptroller', Config.vaults[vaultName].comptroller)

	const suppliedUnderlying = useMemo(() => {
		const supply = supplyBalances.find(balance => balance.address === vault.vaultAddress)
		if (supply === undefined) return BigNumber.from(0)
		if (exchangeRates[vault.vaultAddress] === undefined) return BigNumber.from(0)
		return decimate(supply.balance.mul(exchangeRates[vault.vaultAddress]))
	}, [supplyBalances, exchangeRates, vault.vaultAddress])

	const borrowed = useMemo(() => {
		const borrow = borrowBalances.find(balance => balance.address === vault.vaultAddress)
		if (borrow === undefined) return BigNumber.from(0)
		return borrow.balance
	}, [vault, borrowBalances])

	const isInVault = useMemo(() => {
		console.log(accountVaults)
		return accountVaults && accountVaults.find(_vault => _vault.vaultAddress === vault.vaultAddress)
	}, [accountVaults, vault.vaultAddress])

	const [isChecked, setIsChecked] = useState(!!isInVault)
	const [isOpen, setIsOpen] = useState(false)

	const handleOpen = () => {
		!isOpen ? setIsOpen(true) : setIsOpen(false)
		showSupplyModal && setIsOpen(true)
	}

	const baskets = useBaskets()
	const basket = useMemo(() => {
		if (!baskets) return
		return baskets.find(basket => basket.symbol === 'bSTBL')
	}, [baskets])
	const info = useBasketInfo(basket)
	const composition = useComposition(basket)
	const avgBasketAPY =
		composition &&
		(composition
			.map(function (component) {
				return component.apy
			})
			.reduce(function (a, b) {
				return a + parseFloat(formatUnits(b))
			}, 0) /
			composition.length) *
			100

	return (
		<>
			<Accordion open={isOpen || showSupplyModal} className='my-2 rounded border border-primary-300'>
				<AccordionHeader
					onClick={handleOpen}
					className={`rounded border-0 bg-primary-100 p-2 hover:bg-primary-200 ${isOpen && 'rounded-b-none bg-primary-200'}`}
				>
					<div className='flex w-full flex-row items-center justify-center'>
						<div className='mx-auto my-0 flex w-full flex-row items-center text-start align-middle'>
							<Image
								src={`/images/tokens/${vault.icon}`}
								alt={`${vault.underlyingSymbol}`}
								width={24}
								height={24}
								className='inline-block select-none'
							/>
							<span className='inline-block text-left align-middle'>
								<Typography className='ml-2 font-medium leading-5'>{vault.underlyingSymbol}</Typography>
							</span>
						</div>
						<div className='mx-auto my-0 flex w-full items-center justify-center'>
							<Typography className='ml-2 font-medium leading-5'>
								{account
									? getDisplayBalance(
											accountBalances.find(balance => balance.address === vault.underlyingAddress).balance,
											vault.underlyingDecimals,
									  )
									: '-'}
							</Typography>
						</div>
						<div className='mx-auto my-0 flex w-full items-center justify-center'>
							<Typography className='ml-2 font-medium leading-5'>
								{vault.isBasket && avgBasketAPY ? getDisplayBalance(avgBasketAPY, 0, 2) + '%' : '-'}
							</Typography>
						</div>
						<div className='mx-auto my-0 flex w-full flex-col items-end'>
							<Typography className='ml-2 font-medium leading-5'>
								<span className='inline-block align-middle'>
									{`$${getDisplayBalance(decimate(vault.supplied.mul(vault.price).sub(vault.totalBorrows.mul(vault.price)), 18))}`}
								</span>
							</Typography>
						</div>
					</div>
				</AccordionHeader>
				<AccordionBody className='rounded-b-lg bg-primary-100 p-3'>
					<StatBlock
						label='Supply Details'
						stats={[
							{
								label: 'Total Supplied',
								value: `${getDisplayBalance(vault.supplied, vault.underlyingDecimals)} ${vault.underlyingSymbol} | $${getDisplayBalance(
									decimate(vault.supplied.mul(vault.price)),
								)}`,
							},
							{
								label: 'Your Supply',
								value: `${getDisplayBalance(suppliedUnderlying, vault.underlyingDecimals)} ${vault.underlyingSymbol} | $${getDisplayBalance(
									decimate(suppliedUnderlying.mul(vault.price)),
								)}`,
							},
							{
								label: 'Collateral',
								value: (
									<Tooltipped
										content={
											<>
												<Typography variant='sm' className='font-semibold'>
													{isInVault ? 'Exit' : 'Enter'} Vault w/ Supplied Collateral
												</Typography>
												<Badge className='m-2 bg-red font-semibold'>WARNING</Badge>
												<Typography variant='sm'>
													Any supplied assets that are flagged as collateral can be seized if you are liquidated.
												</Typography>
											</>
										}
									>
										<Switch
											checked={isChecked}
											disabled={
												(isInVault && borrowed.gt(0)) ||
												supplyBalances.find(balance => balance.address === vault.vaultAddress).balance.eq(0)
											}
											onChange={setIsChecked}
											onClick={(event: { stopPropagation: () => void }) => {
												event.stopPropagation()
												if (isInVault) {
													handleTx(comptroller.exitMarket(vault.vaultAddress), `Exit Vault (${vault.underlyingSymbol})`)
												} else {
													handleTx(
														comptroller.enterMarkets([vault.vaultAddress], Config.addressMap.DEAD), // Use dead as a placeholder param for `address borrower`, it will be unused
														`Enter Vault (${vault.underlyingSymbol})`,
													)
												}
											}}
											className={classNames(
												!isInVault && borrowed.eq(0) ? 'cursor-default opacity-50' : 'cursor-pointer opacity-100',
												'border-transparent relative inline-flex h-[14px] w-[28px] flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out',
											)}
										>
											<span
												aria-hidden='true'
												className={classNames(
													isInVault ? 'translate-x-[14px]' : 'translate-x-0',
													'pointer-events-none inline-block h-[10px] w-[10px] transform rounded-full bg-text-300 shadow ring-0 transition duration-200 ease-in-out',
												)}
											/>
										</Switch>
									</Tooltipped>
								),
							},
							{
								label: 'Wallet Balance',
								value: `${getDisplayBalance(
									accountBalances.find(balance => balance.address === vault.underlyingAddress).balance,
									vault.underlyingDecimals,
								)} ${vault.underlyingSymbol}`,
							},
						]}
					/>
					<VaultDetails asset={vault} title='Vault Details' vaultName={vaultName} />
					<div className={`mt-4 flex ${isDesktop ? 'flex-row gap-4' : 'flex-col gap-2'}`}>
						<div className='flex w-full flex-col'>
							<Button fullWidth onClick={() => setShowSupplyModal(true)} className='!p-2 !text-base'>
								Supply / Withdraw
							</Button>
						</div>
						<div className='flex w-full flex-col'>
							<Link href={`/vaults/${vault.underlyingSymbol}`}>
								<Button fullWidth text='Details' />
							</Link>
						</div>
					</div>
				</AccordionBody>
			</Accordion>
			<VaultSupplyModal
				vaultName={vaultName}
				asset={vault}
				show={showSupplyModal}
				onHide={() => {
					setShowSupplyModal(false)
					setIsOpen(true)
				}}
			/>
		</>
	)
}

const VaultListItemSynth: React.FC<VaultListItemProps> = ({
	vault,
	vaultName,
	accountLiquidity,
	accountBalances,
	borrowBalances,
}: VaultListItemProps) => {
	const [showBorrowModal, setShowBorrowModal] = useState(false)
	const [isOpen, setIsOpen] = useState(false)

	const borrowed = useMemo(() => borrowBalances.find(balance => balance.address === vault.vaultAddress).balance, [borrowBalances, vault])

	const handleOpen = () => {
		!isOpen ? setIsOpen(true) : setIsOpen(false)
		showBorrowModal && setIsOpen(true)
	}

	const accountBal = accountBalances.find(balance => balance.address === vault.underlyingAddress)
	const accountBalance = accountBal !== undefined ? accountBal.balance : BigNumber.from(0)

	return (
		<>
			<Accordion open={isOpen || showBorrowModal} className='my-2 rounded border border-primary-300'>
				<AccordionHeader
					onClick={handleOpen}
					className={`rounded border-0 bg-primary-100 p-3 hover:bg-primary-200 ${isOpen && 'rounded-b-none bg-primary-200'}`}
				>
					<div className='flex w-full flex-row items-center justify-center'>
						<div className='mx-auto my-0 flex w-full flex-row items-center text-start align-middle'>
							<Image
								src={`/images/tokens/${vault.icon}`}
								alt={`${vault.underlyingSymbol}`}
								width={32}
								height={32}
								className='inline-block select-none'
							/>
							<span className='inline-block text-left align-middle'>
								<Typography className='ml-2 font-medium leading-5'>{vault.underlyingSymbol}</Typography>
							</span>
						</div>
						<div className='mx-auto my-0 flex w-full items-center justify-center'>
							<Typography className='ml-2 font-medium leading-5'>{getDisplayBalance(vault.borrowApy)}% </Typography>
						</div>
						<div className='mx-auto my-0 flex w-full flex-col items-end'>
							<Typography className='ml-2 font-medium leading-5'>
								<span className='inline-block align-middle'>{getDisplayBalance(accountBalance)} </span>
							</Typography>
						</div>
					</div>
				</AccordionHeader>
				<AccordionBody className='bg-primary-100 p-3'>
					<StatBlock
						label='Debt Information'
						stats={[
							{
								label: 'Total Debt',
								value: `$${getDisplayBalance(decimate(vault.totalBorrows.mul(vault.price)), vault.underlyingDecimals)}`,
							},
							{
								label: 'Your Debt',
								value: `${getDisplayBalance(borrowed)} ${vault.underlyingSymbol} | $${getDisplayBalance(
									decimate(borrowed.mul(vault.price)),
								)}`,
							},
							{
								label: 'Debt Limit Remaining',
								value: `$${getDisplayBalance(accountLiquidity.usdBorrowable)}`,
							},
							{
								label: '% of Your Debt',
								value: `${getDisplayBalance(
									accountLiquidity.usdBorrow.gt(0)
										? borrowed.mul(vault.price).div(decimate(accountLiquidity.usdBorrow)).mul(100)
										: BigNumber.from(0),
								)}%`,
							},
						]}
					/>
					<VaultDetails asset={vault} title='Vault Details' vaultName={vaultName} />
					<div className={`mt-4 flex ${isDesktop ? 'flex-row' : 'flex-col'} gap-4`}>
						<div className='flex w-full flex-col'>
							<Button fullWidth onClick={() => setShowBorrowModal(true)}>
								Mint / Repay
							</Button>
						</div>
						<div className='flex w-full flex-col'>
							<Link href={`/vaults/${vault.underlyingSymbol}`}>
								<Button fullWidth text='Details' />
							</Link>
						</div>
					</div>
				</AccordionBody>
			</Accordion>
			<VaultBorrowModal
				vaultName={vaultName}
				asset={vault}
				show={showBorrowModal}
				onHide={() => {
					setShowBorrowModal(false)
					setIsOpen(true)
				}}
			/>
		</>
	)
}

export default VaultList

type VaultListProps = {
	vaultName: string
}

type VaultListItemProps = {
	vault: ActiveSupportedVault
	vaultName: string
	accountBalances?: Balance[]
	accountVaults?: ActiveSupportedVault[]
	accountLiquidity?: AccountLiquidity
	supplyBalances?: Balance[]
	borrowBalances?: Balance[]
	exchangeRates?: { [key: string]: BigNumber }
}