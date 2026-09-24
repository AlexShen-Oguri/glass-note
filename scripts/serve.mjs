import {networkInterfaces} from 'node:os';
import {createPreviewServer} from './preview-server.mjs';

const args=process.argv.slice(2);
const option=name=>args.find(value=>value.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const addresses=Object.values(networkInterfaces()).flat().filter(item=>item&&!item.internal&&item.family==='IPv4').map(item=>item.address);
const lan=args.includes('--lan');
const host=option('host')??(lan&&addresses.length===1?addresses[0]:'127.0.0.1');
if(lan&&!option('host')&&addresses.length!==1){console.error('Choose a local interface with --host=ADDRESS:',addresses.join(', ')||'no IPv4 interface found');process.exit(1);}
if(host!=='127.0.0.1'&&!addresses.includes(host)){console.error('Host must be loopback or an active local IPv4 interface.');process.exit(1);}
const port=Number(option('port')??process.env.GLASS_NOTES_PORT??(lan?4174:4173));
if(!Number.isInteger(port)||port<1||port>65535){console.error('Port must be an integer from 1 to 65535.');process.exit(1);}
const server=createPreviewServer('dist');
server.on('error',error=>{console.error(`Preview could not start: ${error.message}`);process.exitCode=1;});
server.listen(port,host,()=>console.log(`Glass Notes ${lan?'phone':'local'} preview: http://${host}:${port}\n${lan?'Connect the phone to the same reachable network.':'This address is local to this computer.'}`));
