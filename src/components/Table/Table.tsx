import { Table } from 'react-bootstrap'
import styled from 'styled-components'

export const StyledTable = styled(Table)`
	width: 100%;
	background: ${(props) => props.theme.color.primary[100]};
	border-radius: ${(props) => props.theme.borderRadius}px;
	color: ${(props) => props.theme.color.text[100]};
	border-color: transparent;

	th {
		padding-top: ${(props) => props.theme.spacing[4]};
		padding-bottom: ${(props) => props.theme.spacing[4]};
		padding: ${(props) => props.theme.spacing[4]};
	}

	th.strategy,
	th.price,
	td.strategy,
	td.price {
		text-align: center;
	}

	> thead > tr > th,
	> tbody > tr > td {
		&:first-child {
			padding-left: 20px;
		}
	}

	tbody {
		border-top-color: transparent !important;

		> tr {
			vertical-align: middle;

			&:nth-child(odd) {
				background: ${(props) => props.theme.color.primary[200]};
			}

			> td {
				color: ${(props) => props.theme.color.text[100]} !important;
				border: none;
			}
		}
	}

	@media (max-width: ${(props) => props.theme.breakpoints.sm}px) {
		width: 100%;

		th.strategy, td.strategy {
			display: none;
		}
	}
`

export const TableContainer = styled.div`
	display: flex;
	width: 100%;
	background-color: ${(props) => props.theme.color.primary[100]};
	border-radius: 8px;
	border: ${(props) => props.theme.border.default};
`
