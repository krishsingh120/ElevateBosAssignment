import Fastify from 'fastify';

const app = Fastify({
  logger: true
});

app.get('/health', async (request, reply) => {
  return { status: 'ok', environment: process.env.NODE_ENV || 'development' };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
