export default () => ({
  net: {
    baseUrl: process.env.BASE_URL,
    host: parseInt(process.env.NET_HOST || '0.0.0.0'),
    port: parseInt(process.env.NET_PORT || '3000', 10),
  },
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});
