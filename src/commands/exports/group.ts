import Command, { Args } from '../../base'
import Table, { type HorizontalAlignment } from 'cli-table3'
import type { Export, QueryPageSize, QueryParamsList } from '@commercelayer/sdk'
import { clColor, clConfig, clOutput } from '@commercelayer/cli-core'
import type { CommandError } from '@oclif/core/lib/interfaces'
import * as cliux from '@commercelayer/cli-ux'



export default class ExportsGroup extends Command {

	static description = 'list all the exports related to an export group'

	static aliases = ['exp:group']

	static examples = [
		'$ commercelayer exports:group <group-id>',
		'$ cl exp:group <group-id>'
  ]


	static args = {
		group_id: Args.string({ name: 'group_id', description: 'unique id of the group export', required: true, hidden: false })
  }


	async run(): Promise<any> {

		const { args, flags } = await this.parse(ExportsGroup)

		const groupId = args.group_id

		this.commercelayerInit(flags)


		try {

			const pageSize = clConfig.api.page_max_size as QueryPageSize
			const tableData = []
			let currentPage = 0
			let pageCount = 1

			cliux.action.start('Fetching exports')
			while (currentPage < pageCount) {

				const params: QueryParamsList<Export> = {
					pageSize,
					pageNumber: ++currentPage,
					sort: ['reference', '-completed_at'],
					filters: { reference_start: `${groupId}-` },
				}


				// eslint-disable-next-line no-await-in-loop
				const exports = await this.cl.exports.list(params)

				if (exports?.length) {
					tableData.push(...exports)
					currentPage = exports.meta.currentPage
					pageCount = exports.meta.pageCount
				}

			}

			cliux.action.stop()

			this.log()

			if (tableData?.length) {

				const table = new Table({
					head: ['ID', 'Resource type', 'Status', 'Records', 'Started at', 'Completed at'],
					// colWidths: [100, 200],
					style: {
						head: ['brightYellow'],
						compact: false,
					},
				})

				// let index = 0
				table.push(...tableData.map(e => [
					// { content: ++index, hAlign: 'right' as HorizontalAlignment },
					clColor.blueBright(e.id || ''),
					e.resource_type || '',
					{ content: this.exportStatus(e.status), hAlign: 'center' as HorizontalAlignment },
					{ content: e.records_count, hAlign: 'center' as HorizontalAlignment },
					clOutput.localeDate(e.started_at || ''),
					clOutput.localeDate(e.completed_at || ''),
				]))

				this.log(table.toString())

				this.log()

			} else this.log(clColor.italic(`Export group with id ${groupId} not found`))

			this.log()

			return tableData

		} catch (error) {
      if (this.cl.isApiError(error) && (error.status === 404))
        this.error(`Unable to find export group${groupId ? ` with id ${clColor.msg.error(groupId)}` : ''}`)
			else this.handleError(error as CommandError, flags)
		}

	}

}
