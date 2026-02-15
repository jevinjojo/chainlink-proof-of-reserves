import {
	type CronPayload,
	handler,
	CronCapability,
	HTTPClient,
	Runner,
	type Runtime,
} from '@chainlink/cre-sdk'
import { z } from 'zod'

const configSchema = z.object({
	schedule: z.string(),
	backendUrl: z.string(),
	wallet: z.string(),
	claimed: z.number(),
	exchangeId: z.number(),
})

type Config = z.infer<typeof configSchema>

interface VerificationResult {
	wallet: string
	claimed: number
	actualBalance: number
	verified: boolean
	discrepancyPct: number
}

const doVerification = (runtime: Runtime<Config>): string => {
	runtime.log(`Starting Proof of Reserves check for wallet: ${runtime.config.wallet}`)
	runtime.log(`Claimed reserves: ${runtime.config.claimed} ETH`)

	const backendUrl: string = runtime.config.backendUrl
	const wallet: string = runtime.config.wallet
	const claimed: number = runtime.config.claimed
	const requestUrl: string = `${backendUrl}/check/ethereum/${wallet}/${claimed}`

	const httpCapability = new HTTPClient()

	const response = httpCapability
		.sendRequest(runtime as any, { method: 'GET', url: requestUrl })
		.result()

	if (response.statusCode !== 200) {
		throw new Error(`Backend request failed with status: ${response.statusCode}`)
	}

	const responseText = Buffer.from(response.body).toString('utf-8')
	const result = JSON.parse(responseText) as VerificationResult

	runtime.log(`Wallet: ${result.wallet}`)
	runtime.log(`Claimed: ${result.claimed} ETH`)
	runtime.log(`Actual Balance: ${result.actualBalance} ETH`)
	runtime.log(`Verified: ${result.verified}`)
	runtime.log(`Discrepancy: ${result.discrepancyPct.toFixed(2)}%`)

	if (!result.verified) {
		runtime.log(`⚠️ ALERT: Reserve mismatch detected! Discrepancy: ${result.discrepancyPct.toFixed(2)}%`)
	} else {
		runtime.log(`✅ Reserves verified successfully`)
	}

	return JSON.stringify({
		verified: result.verified,
		discrepancyPct: result.discrepancyPct,
		actualBalance: result.actualBalance,
	})
}

const onCronTrigger = (runtime: Runtime<Config>, payload: CronPayload): string => {
	if (!payload.scheduledExecutionTime) {
		throw new Error('Scheduled execution time is required')
	}
	runtime.log('Running Proof of Reserves CronTrigger')
	return doVerification(runtime)
}

const initWorkflow = (config: Config) => {
	const cronTrigger = new CronCapability()
	return [
		handler(
			cronTrigger.trigger({
				schedule: config.schedule,
			}),
			onCronTrigger,
		),
	]
}

export async function main() {
	const runner = await Runner.newRunner<Config>({
		configSchema,
	})
	await runner.run(initWorkflow)
}