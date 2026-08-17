import 'dotenv/config';
import * as joi from 'joi';

interface IEnvVars {
  PORT: number;
  //DATABASE_URL: string;
  NATS_SERVERS: string[];
  STRIPE_SECRET_KEY: string;
  STRIPE_SECRET_SIGNATURE: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
  PAYMENTS_MS_URL: string;
}

const envVarsSchema: joi.ObjectSchema<IEnvVars> = joi
  .object({
    PORT: joi.number().required(),
    STRIPE_SECRET_KEY: joi.string().required(),
    STRIPE_SECRET_SIGNATURE: joi.string().required(),
    STRIPE_SUCCESS_URL: joi.string().required(),
    STRIPE_CANCEL_URL: joi.string().required(),
    PAYMENTS_MS_URL: joi.string().required(),
    //DATABASE_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
  })
  .unknown();

const { error, value } = envVarsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const env: IEnvVars = value;

export const envs = {
  port: env.PORT,
  stripeSecretKey: env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: env.STRIPE_SECRET_SIGNATURE,
  stripeSuccessUrl: env.STRIPE_SUCCESS_URL,
  stripeCancelUrl: env.STRIPE_CANCEL_URL,
  paymentsMsUrl: env.PAYMENTS_MS_URL,
  //databaseUrl: env.DATABASE_URL,
  natsServers: env.NATS_SERVERS,
};
