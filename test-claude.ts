import { parseEmail } from './lib/ai/parser'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

async function run() {
  const email = "Price changes for 3 mm and 5 mm clear acrylic. These will be increasing by 8% on the 7th of April 2026"
  const result = await parseEmail(email)
  fs.writeFileSync('test-output.json', JSON.stringify(result, null, 2), 'utf-8')
}

run().catch(console.error)
