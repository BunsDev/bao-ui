import React, { Fragment } from 'react'
import {
	HeaderWrapper,
	ItemContainer,
	ItemWrapper,
	MarketTable,
	MarketTableContainer,
	TableHeader,
} from 'views/Markets/components/styles'

type Column = {
	header: any
	value: any
}

type TableProps = {
	columns: Column[]
	items: any[]
	onClick?: (e: any) => void
}

export const Table = ({ columns, items, onClick }: TableProps) => (
	<MarketTableContainer>
		<MarketTable>
			<TableHeader>
				<HeaderWrapper>
					{columns.map(({ header }: Column, i) => (
						<Fragment key={i}>{header}</Fragment>
					))}
				</HeaderWrapper>
			</TableHeader>
			{items?.map((item, i) => (
				<ItemContainer key={i}>
					<ItemWrapper key={i}>
						{columns.map(({ value }, j) => (
							<Fragment key={j}>{value(item, i)}</Fragment>
						))}
					</ItemWrapper>
				</ItemContainer>
			))}
		</MarketTable>
	</MarketTableContainer>
)

export default Table
