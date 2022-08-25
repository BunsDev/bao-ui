import { ActiveSupportedMarket } from '@/bao/lib/types'
import { StatBlock } from '@/components/Stats'
import { useAccountLiquidity } from '@/hooks/markets/useAccountLiquidity'
import { useAccountBalances, useBorrowBalances, useSupplyBalances } from '@/hooks/markets/useBalances'
import { useExchangeRates } from '@/hooks/markets/useExchangeRates'
import { decimate, getDisplayBalance } from '@/utils/numberFormat'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { MarketOperations } from './Modals/Modals'

type MarketStatBlockProps = {
	title?: string
	asset: ActiveSupportedMarket
	amount?: number
}

type MarketStatProps = {
	asset: ActiveSupportedMarket
	amount: string
	operation: MarketOperations
}

const SupplyDetails = ({ asset }: MarketStatBlockProps) => {
	const supplyBalances = useSupplyBalances()
	const balances = useAccountBalances()
	const { exchangeRates } = useExchangeRates()

	const supplyBalance = useMemo(
		() =>
			supplyBalances &&
			supplyBalances.find(balance => balance.address.toLowerCase() === asset.marketAddress.toLowerCase()) &&
			exchangeRates &&
			exchangeRates[asset.marketAddress]
				? supplyBalances.find(balance => balance.address.toLowerCase() === asset.marketAddress.toLowerCase()).balance *
				  decimate(exchangeRates[asset.marketAddress]).toNumber()
				: 0,
		[supplyBalances, exchangeRates],
	)
	const walletBalance = useMemo(
		() =>
			balances && balances.find(_balance => _balance.address === asset.underlyingAddress)
				? balances.find(_balance => _balance.address === asset.underlyingAddress).balance
				: 0,
		[balances],
	)
	const supplyBalanceUsd = useMemo(() => {
		if (!supplyBalance) return
		return getDisplayBalance(new BigNumber(asset.price).times(supplyBalance).toFixed(2), 0)
	}, [supplyBalance])
	const walletBalanceUsd = useMemo(() => {
		if (!walletBalance) return
		return getDisplayBalance(new BigNumber(asset.price).times(walletBalance).toFixed(2), 0)
	}, [walletBalance])

	return (
		<StatBlock
			label='Supply Stats'
			stats={[
				{
					label: 'Supply APY',
					value: `${asset.supplyApy.toFixed(2)}%`,
				},
				{
					label: 'Supply Balance',
					value: `${supplyBalance.toFixed(4)} ${asset.underlyingSymbol} | $${supplyBalanceUsd || '~'}`,
				},
				{
					label: 'Wallet Balance',
					value: `${walletBalance.toFixed(4)} ${asset.underlyingSymbol} | $${walletBalanceUsd || '~'}`,
				},
			]}
		/>
	)
}

export const MarketDetails = ({ asset, title }: MarketStatBlockProps) => {
	const totalReservesUsd = asset.totalReserves ? `$${getDisplayBalance(asset.totalReserves * asset.price, 0)}` : '-'
	const reserveFactor = asset.reserveFactor ? `${asset.reserveFactor * 100}%` : '-'

	return (
		<StatBlock
			label={title}
			stats={[
				{
					label: 'Collateral Factor',
					value: `${asset.collateralFactor * 100}%`,
				},
				{
					label: 'Inital Margin Factor',
					value: `${asset.imfFactor * 100}%`,
				},
				{
					label: 'Reserve Factor',
					value: reserveFactor,
				},
				{
					label: 'Total Reserves',
					value: totalReservesUsd,
				},
			]}
		/>
	)
}

const MintDetails = ({ asset }: MarketStatBlockProps) => {
	const borrowBalances = useBorrowBalances()
	const balances = useAccountBalances()

	const borrowBalance = useMemo(
		() =>
			borrowBalances && borrowBalances.find(_borrowBalance => _borrowBalance.address === asset.marketAddress)
				? borrowBalances.find(_borrowBalance => _borrowBalance.address === asset.marketAddress).balance
				: 0,
		[borrowBalances],
	)
	const walletBalance = useMemo(
		() =>
			balances && balances.find(_balance => _balance.address === asset.underlyingAddress)
				? balances.find(_balance => _balance.address === asset.underlyingAddress).balance
				: 0,
		[balances],
	)
	const price = useMemo(() => {
		if (!borrowBalance) return
		return getDisplayBalance(new BigNumber(asset.price).times(borrowBalance).toFixed(2), 0)
	}, [borrowBalance])

	return (
		<StatBlock
			label='Mint Info'
			stats={[
				{
					label: 'APR',
					value: `${asset.borrowApy.toFixed(2)}%`,
				},
				{
					label: 'Debt Balance',
					value: `${borrowBalance.toFixed(4)} ${asset.underlyingSymbol} | $${price || '~'}`,
				},
				{
					label: 'Wallet Balance',
					value: `${walletBalance.toFixed(4)} ${asset.underlyingSymbol}`,
				},
			]}
		/>
	)
}

const DebtLimit = ({ asset, amount }: MarketStatBlockProps) => {
	const accountLiquidity = useAccountLiquidity()

	const change = amount ? asset.collateralFactor * amount * asset.price : 0
	const borrowable = accountLiquidity ? accountLiquidity.usdBorrow + accountLiquidity.usdBorrowable : 0
	const newBorrowable = borrowable + change

	return (
		<div className='mt-4'>
			<StatBlock
				label='Debt Limit Stats'
				stats={[
					{
						label: 'Debt Limit',
						value: `$${getDisplayBalance(borrowable.toFixed(2), 0)} ➜ $${getDisplayBalance(newBorrowable.toFixed(2), 0)}`,
					},
					{
						label: 'Debt Limit Used',
						value: `${(accountLiquidity && borrowable !== 0 ? (accountLiquidity.usdBorrow / borrowable) * 100 : 0).toFixed(
							2,
						)}% ➜ ${(accountLiquidity && newBorrowable !== 0 ? (accountLiquidity.usdBorrow / newBorrowable) * 100 : 0).toFixed(2)}%`,
					},
				]}
			/>
		</div>
	)
}

const DebtLimitRemaining = ({ asset, amount }: MarketStatBlockProps) => {
	const accountLiquidity = useAccountLiquidity()
	const change = amount ? amount * asset.price : 0

	const borrow = accountLiquidity ? accountLiquidity.usdBorrow : 0

	const newBorrow = borrow ? borrow - (change > 0 ? change : 0) : 0

	const borrowable = accountLiquidity ? accountLiquidity.usdBorrow + accountLiquidity.usdBorrowable : 0

	const newBorrowable = borrowable ? borrowable + (change < 0 ? change : 0) : 0

	return (
		<div className='mt-4'>
			<StatBlock
				label='Debt Limit Stats'
				stats={[
					{
						label: 'Debt Limit Remaining',
						value: `$${getDisplayBalance(accountLiquidity ? accountLiquidity.usdBorrowable.toFixed(2) : 0, 0)} ➜ $${getDisplayBalance(
							accountLiquidity ? accountLiquidity.usdBorrowable + change : 0,
							0,
						)}`,
					},
					{
						label: 'Debt Limit Used',
						value: `${(borrowable !== 0 ? (borrow / borrowable) * 100 : 0).toFixed(2)}% ➜ ${(newBorrowable !== 0
							? borrow < 0.01
								? (change / borrowable) * -100
								: (newBorrow / newBorrowable) * 100
							: 0
						).toFixed(2)}%`,
					},
				]}
			/>
		</div>
	)
}

export const MarketStats = ({ operation, asset, amount }: MarketStatProps) => {
	const parsedAmount = amount && !isNaN(amount as unknown as number) ? parseFloat(amount) : 0
	switch (operation) {
		case MarketOperations.supply:
			return (
				<>
					<SupplyDetails asset={asset} />
					<DebtLimit asset={asset} amount={parsedAmount} />
				</>
			)
		case MarketOperations.withdraw:
			return (
				<>
					<SupplyDetails asset={asset} />
					<DebtLimit asset={asset} amount={-1 * parsedAmount} />
				</>
			)
		case MarketOperations.mint:
			return (
				<>
					<MintDetails asset={asset} />
					<DebtLimitRemaining asset={asset} amount={-1 * parsedAmount} />
				</>
			)
		case MarketOperations.repay:
			return (
				<>
					<MintDetails asset={asset} />
					<DebtLimitRemaining asset={asset} amount={parsedAmount} />
				</>
			)
	}
}
