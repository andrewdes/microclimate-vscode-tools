#!/usr/bin/env expect

# These are passed as cli args from deploy.sh because they are not available in the environment
set artifact_name [lindex $argv 0]
set dhe_path [lindex $argv 1]

spawn scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null $artifact_name "$env(dhe_user)@$env(dhe_ip):$dhe_path"
expect "assword:"
send "$env(dhe_pw)\n"
interact
#lassign [wait] pid spawnid return_code value