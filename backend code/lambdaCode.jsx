import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
export const handler = async (event) => {
    /*
     * Generate HTTP response using 200 status code with a simple body.
     */
    const response = {
        status: '200',
        statusDescription: 'OK',
        headers: {
            vary: [{
                key: 'Vary',
                value: '*',
            }],
            'last-modified': [{
                key: 'Last-Modified',
                value: '2017-01-13',
            }],
        },
        body:JSON.stringify(event)
    };
    const command = new PutCommand({
        TableName: "Test_Ameya_savedResumes",
        Item: {
          Id: event.email,
          data: event
        },
      });
      const ddb_response = await docClient.send(command);
      response.body=JSON.stringify(ddb_response);
      console.log(ddb_response)
    return response;
};