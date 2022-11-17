const getBoardQuery = `query($owner: String!, $projectNumber: Int!) {
  organization(login: $owner) {
    projectV2(number: $projectNumber) {
      id
      items(last: 100, orderBy: {field: POSITION, direction: ASC}) {
        nodes {
          databaseId
          id
          content {
            ... on Issue {
              id
              number
            }
            ... on PullRequest {
              id
              number
            }
          }
        }
      }
      fields(first: 20) {
        nodes {
          ... on ProjectV2SingleSelectField {
            id
            name
            dataType
            options {
              name
              id
            }
          }
        }
      }
    }
  }
}`

const { organization } = await github.graphql(getBoardQuery, {
  owner: '${{inputs.OWNER}}',
  projectNumber: parseInt('${{inputs.PROJECT_NUMBER}}')
})

const triggerNumber = context.eventName === 'issues' ? context.payload.issue.number : context.payload.pull_request.number


const selectField = organization.projectV2.fields.nodes.find((node) => node.name === '${{inputs.FIELD_NAME}}' && node.dataType === 'SINGLE_SELECT')
const boardItem = organization.projectV2.items.nodes.find(node => node.content.number === triggerNumber)
const singleSelectOption = selectField.options.find(option => option.name === '${{inputs.FIELD_VALUE}}')

const projectId = organization.projectV2.id
const itemId = boardItem.id
const fieldId = selectField.id
const singleSelectOptionId = singleSelectOption.id

const assignmentMutationQuery = `mutation($fieldId: ID!, $itemId: ID!, $projectId: ID!, $singleSelectOptionId: String!) {
  updateProjectV2ItemFieldValue(
    input: {projectId: $projectId, itemId: $itemId, fieldId: $fieldId, value: {singleSelectOptionId: $singleSelectOptionId}}
  ) {
  clientMutationId
  }
}`

await github.graphql(assignmentMutationQuery,{
  fieldId,
  itemId,
  projectId,
  singleSelectOptionId,
})

