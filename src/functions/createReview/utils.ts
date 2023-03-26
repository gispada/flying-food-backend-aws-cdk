const headers = {
  'content-type': 'application/json',
  'access-control-allow-headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'OPTIONS,GET'
}

export const getResponse = (statusCode: number, body: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body)
})
