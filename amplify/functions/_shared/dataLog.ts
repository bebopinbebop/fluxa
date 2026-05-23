export function logAwsTableAccess(tableName: string, operation: string) {
  console.log('[AWSData][TableAccess]', {
    tableName,
    operation,
  });
}
