import { join } from 'path'
import { exec } from 'child_process'
import { writeFileSync, readdirSync, readFileSync } from 'fs'
import { DynamoDB } from 'aws-sdk'
import { APP_NAME, DATA_PATH } from '../lib/constants'

/*
 * This script converts files in the `data` folder to DynamoDB format
 * and makes a batch import into the database, one file per table.
 * Table names in DynamoDB need to match this format: {APP_NAME}_{filename_without_extension}
 */

const isNotDdbFile = (file: string) => !(/.*\.ddb\.json$/).test(file)

const getDataPath = (path = '') => join(__dirname, `../${DATA_PATH}/${path}`)

const dataFiles = readdirSync(getDataPath()).filter(isNotDdbFile)

for (const filename of dataFiles) {
  const content = []
  const [resourceName] = filename.split('.')

  const fileContent = readFileSync(getDataPath(filename), { encoding: 'utf-8' })

  for (const item of JSON.parse(fileContent)) {
    content.push({ PutRequest: { Item: DynamoDB.Converter.marshall(item) } })
  }

  writeFileSync(
    getDataPath(`${resourceName}.ddb.json`),
    JSON.stringify({ [`${APP_NAME}_${resourceName}`]: content })
  )

  exec(
    `aws dynamodb batch-write-item --request-items file://${getDataPath(`${resourceName}.ddb.json`)}`,
    (error, stdout, stderr) => {
      if (error || stderr) {
        console.log(`Error: ${error?.message || stderr}`)
        return
      }

      const { UnprocessedItems } = JSON.parse(stdout)

      if (Object.keys(UnprocessedItems).length === 0) {
        console.log(`> '${resourceName}' successfully imported`)
      } else {
        console.log(stdout)
      }
    }
  )
}
