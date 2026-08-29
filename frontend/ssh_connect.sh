#!/usr/bin/expect

set timeout 30
set host "115.191.9.57"
set user "root"
set password "Wsy123456+"

spawn ssh -o StrictHostKeyChecking=no $user@$host
expect {
    "password:" {
        send "$password\r"
        expect "# "
        send "echo 'SSH连接成功'\r"
        expect "# "
        send "pwd\r"
        expect "# "
        send "ls -la\r"
        expect "# "
        send "exit\r"
    }
    timeout {
        puts "连接超时"
        exit 1
    }
}

expect eof