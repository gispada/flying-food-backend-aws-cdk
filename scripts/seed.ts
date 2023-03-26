import { join } from 'path'
import { exec } from 'child_process'
import { writeFileSync, readdirSync, readFileSync } from 'fs'
import { DynamoDB } from 'aws-sdk'
import type { PutRequest } from 'aws-sdk/clients/dynamodb'
import { APP_NAME, DATA_PATH } from '../lib/constants'

/*
 * This script converts files in the `data` folder to DynamoDB format
 * and makes a batch import into the database, one file per table.
 * Table names in DynamoDB need to match this format: {APP_NAME}_{filename_without_extension}
 */

// Max number of items per batch: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
const BATCH_SIZE = 25

const isNotDdbFile = (file: string) => !(/.*\.ddb\.json$/).test(file)

const getDataPath = (path = '') => join(__dirname, `../${DATA_PATH}/${path}`)

const dataFiles = readdirSync(getDataPath()).filter(isNotDdbFile)

for (const filename of dataFiles) {
  const [resourceName] = filename.split('.')
  const batches: Record<string, PutRequest>[][] = []

  const fileContent = readFileSync(getDataPath(filename), { encoding: 'utf-8' })
  const itemsToInsert = JSON.parse(fileContent) as Record<string, any>[]

  itemsToInsert.forEach((item, i) => {
    const batchIdx = Math.floor(i / BATCH_SIZE)
    batches[batchIdx] ??= []
    batches[batchIdx].push({ PutRequest: { Item: DynamoDB.Converter.marshall(item) } })
  })

  batches.forEach((content, i) => {
    writeFileSync(
      getDataPath(`${resourceName}-${i + 1}.ddb.json`),
      JSON.stringify({ [`${APP_NAME}_${resourceName}`]: content })
    )

    exec(
      `aws dynamodb batch-write-item --request-items file://${getDataPath(`${resourceName}-${i + 1}.ddb.json`)}`,
      (error, stdout, stderr) => {
        if (error || stderr) {
          console.log(`Error: ${error?.message || stderr}`)
          return
        }

        const { UnprocessedItems } = JSON.parse(stdout)

        if (Object.keys(UnprocessedItems).length === 0) {
          console.log(`> ${content.length} '${resourceName}' successfully imported`)
        } else {
          console.log(stdout)
        }
      }
    )
  })
}
