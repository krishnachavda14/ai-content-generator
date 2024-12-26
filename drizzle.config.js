/** @type {import ("drizzle-kit").Config} */
export default{
    schema:"./utils/schema.tsx",
    dialect:'postgresql',
    dbCredentials:{
        url:'postgresql://db_owner:hnFVTHD19eSo@ep-odd-frost-a59blobn.us-east-2.aws.neon.tech/db?sslmode=require',
    }
};
