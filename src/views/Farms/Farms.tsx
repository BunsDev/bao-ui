import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import { useWallet } from 'use-wallet'
import pollyBanner from '../../assets/img/polly.svg'
import Button from '../../components/Button'
import Page from '../../components/Page'
import PageHeader from '../../components/PageHeader'
import Spacer from '../../components/Spacer'
import WalletProviderModal from '../../components/WalletProviderModal'
import useModal from '../../hooks/useModal'
import Farm from '../Farm'
import FarmCards from './components/FarmCards'
import Container from '../../components/Container'
import Balances from './components/Balances'

const Farms: React.FC = () => {
	const { path } = useRouteMatch()
	const { account } = useWallet()
	const [onPresentWalletProviderModal] = useModal(<WalletProviderModal />)
	return (
		<Switch>
			<Page>
				{account ? (
					<>
								<PageHeader
				icon={pollyBanner}
				title="PollyChef is Ready"
				subtitle="Stake Sushiswap and Baoswap LP tokens to earn BAO!"
			/>
			<StyledInfo>
				Be sure to read <a href="https://docs.bao.finance">docs.bao.finance</a>{' '}
				before using the pools so you are familiar with protocol risks and fees!
			</StyledInfo>
			<Spacer size="md" />
			<StyledInfo>
				Please note this is the MATIC version of Bao, Polly. For mainnet, visit{' '}
				<a href="https://bao.finance">bao.finance</a>{' '}
			</StyledInfo>
			<Spacer size="md" />
			<Container>
				<Balances />
			</Container>
						<Route exact path={path}>
							<FarmCards />
						</Route>
						<Route path={`${path}/:farmId`}>
							<Farm />
						</Route>
					</>
				) : (
					<div className="btn-primary"
						style={{
							alignItems: 'center',
							display: 'flex',
							flex: 1,
							justifyContent: 'center',
						}}
					>
						<Button
							onClick={onPresentWalletProviderModal}
							text="🔓 Unlock Wallet"
						/>
					</div>
				)}
			</Page>
		</Switch>
	)
}

const StyledInfo = styled.h3`
	color: ${(props) => props.theme.color.grey[500]};
	font-size: 16px;
	font-weight: 400;
	margin: 0;
	padding: 0;
	text-align: center;

	> b {
		color: ${(props) => props.theme.color.grey[600]};
	}
`

export default Farms
