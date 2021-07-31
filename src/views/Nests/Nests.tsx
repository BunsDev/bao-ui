import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import styled from 'styled-components'
import Button from '../../components/Button'
import Page from '../../components/Page'
import WalletProviderModal from '../../components/WalletProviderModal'
import Nest from '../Nest'
import NestList from './components/ListView/NestList'
import PageHeader from '../../components/PageHeader'
import { useWallet } from 'use-wallet'
import useModal from '../../hooks/useModal'
import pollyNests from '../../assets/img/polly-nests.png'

const Nests: React.FC = () => {
	const { path } = useRouteMatch()
	const { account } = useWallet()
	const [onPresentWalletProviderModal] = useModal(<WalletProviderModal />)
	return (
		<Switch>
			<Page>
				{account ? (
					<>
						<PageHeader
							icon={pollyNests}
							title="Build Your Nest"
							subtitle="Tokenized Portfolios with Set and Forget Strategies!"
						/>
						<Route exact path={path}>
							<NestList />
						</Route>
						<Route path={`${path}/:nestId`}>
							<Nest />
						</Route>
					</>
				) : (
					<div
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

const StyledHeader = styled.h1`
	font-size: 64px;
	font-family: 'Kaushan Script', sans-serif;
	color: ${(props) => props.theme.color.grey[500]};
	width: 20%;
	text-align: center;
	border-bottom: 2px solid ${(props) => props.theme.color.grey[500]};
`

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

export default Nests
