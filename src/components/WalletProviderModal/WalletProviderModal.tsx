import { AbstractConnector } from '@web3-react/abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import {
	NoEthereumProviderError,
	UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector'
import {
	coinbaseWallet,
	injected, walletConnect
} from 'bao/lib/connectors'
import { useEagerConnect, useInactiveListener } from 'bao/lib/hooks'
import { Button, CloseButton } from 'components/Button'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Modal, ModalProps, Row } from 'react-bootstrap'
import styled from 'styled-components'
import Web3 from 'web3'

const connectorsByName: { [name: string]: AbstractConnector } = {
	Metamask: injected,
	CoinbaseWallet: coinbaseWallet,
	WalletConnect: walletConnect,
}

function getErrorMessage(error: Error) {
	if (error instanceof NoEthereumProviderError) {
		return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
	} else if (error instanceof UnsupportedChainIdError) {
		return "You're connected to an unsupported network."
	} else if (error instanceof UserRejectedRequestErrorInjected) {
		return 'Please authorize this website to access your Ethereum account.'
	} else {
		console.error(error)
		return 'An unknown error occurred. Check the console for more details.'
	}
}

const WalletProviderModal = ({ onHide, show }: ModalProps) => {
	const context = useWeb3React<Web3>()
	const {
		connector,
		library,
		chainId,
		account,
		activate,
		deactivate,
		active,
		error,
	} = context

	// handle logic to recognize the connector currently being activated
	const [activatingConnector, setActivatingConnector] = useState<any>()
	useEffect(() => {
		if (activatingConnector && activatingConnector === connector) {
			setActivatingConnector(undefined)
		}
	}, [activatingConnector, connector])

	const triedEager = useEagerConnect()

	useInactiveListener(!triedEager || !!activatingConnector)

	useEffect(() => {
		if (account && active) {
			onHide()
		}
	}, [account, onHide])

	const hideModal = useCallback(() => {
		onHide()
	}, [onHide])

	return (
		<Modal show={show} onHide={hideModal} centered>
			<CloseButton onClick={onHide} onHide={hideModal} />
			<Modal.Header>
				<Modal.Title>Select a wallet provider.</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				{Object.keys(connectorsByName).map((name) => {
					const currentConnector = connectorsByName[name]
					const activating = currentConnector === activatingConnector
					const connected = currentConnector === connector
					const disabled =
						!triedEager || !!activatingConnector || connected || !!error

					return (
						<Button
							disabled={disabled}
							key={name}
							onClick={() => {
								setActivatingConnector(currentConnector)
								activate(connectorsByName[name], (error) => {
									if (error) {
										setActivatingConnector(undefined)
									}
								})
							}}
						>
							<Row>
								<Col>
									<ConnectorIconContainer>
										<img
											src={`${name}.png`}
											style={{
												height: '24px',
												marginRight: '0.75rem',
												verticalAlign: 'middle',
											}}
										/>
									</ConnectorIconContainer>
									{activating ? 'Connecting...' : `${name}`}
								</Col>
							</Row>
						</Button>
					)
				})}
			</Modal.Body>

			<Modal.Footer>
				<Button text="Cancel" variant="secondary" onClick={onHide} />
			</Modal.Footer>
		</Modal>
	)
}

const StyledWalletsWrapper = styled.div`
	display: flex;
	flex-wrap: wrap;
	@media (max-width: ${(props) => props.theme.breakpoints.sm}px) {
		height: 100vh;
		overflow-y: scroll;
	}
	@media (max-width: ${(props) => props.theme.breakpoints.md}px) {
		flex-direction: column;
		flex-wrap: none;
	}
`

const StyledWalletCard = styled.div`
	flex-basis: calc(50% - ${(props) => props.theme.spacing[2]}px);
`

export const ConnectorIconContainer = styled.div`
	height: 100%;
	align-items: center;
	margin: 0 auto;
	display: inline-block;
	vertical-align: middle;
	color: ${(props) => props.theme.color.text[100]};

	@media (max-width: ${(props) => props.theme.breakpoints.sm}px) {
		display: none;
	}
`

export default WalletProviderModal
