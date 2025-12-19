# SSH Port Forwarding for ReviewInn Mobile

Since you're accessing the server via SSH, you need to forward the port to view the Flutter app on your local computer.

## 🔌 Quick Setup

### On Your Local Computer (Not on SSH):

Open a **new terminal window** on your local machine and run:

```bash
ssh -L 8080:localhost:8080 hasan181@YOUR_SERVER_IP
```

Replace `YOUR_SERVER_IP` with your actual server IP address or hostname.

### Alternative Ports (if 8080 is busy on your local machine):

```bash
# Forward remote 8080 to local 3000
ssh -L 3000:localhost:8080 hasan181@YOUR_SERVER_IP

# Then access at: http://localhost:3000
```

## 📱 After Port Forwarding is Setup

Once the SSH tunnel is established, open your **local browser** and go to:

```
http://localhost:8080
```

You should now see your Flutter app running! 🎉

## 🔧 Using VS Code Remote-SSH Extension

If you're using VS Code with Remote-SSH extension:

1. VS Code may automatically forward ports for you
2. Check the "PORTS" tab in VS Code (bottom panel)
3. If not auto-forwarded, click "Forward a Port" and add port 8080
4. Then access at http://localhost:8080

## 🚀 Complete Workflow

### Terminal 1 (Local - Port Forwarding):
```bash
ssh -L 8080:localhost:8080 hasan181@YOUR_SERVER_IP
# Keep this terminal open while developing
```

### Terminal 2 (SSH - Running the App):
```bash
cd /home/hasan181/personal/my_project/reviewinn_project/reviewinn-mobile
./run.sh
```

### Browser (Local):
```
http://localhost:8080
```

## 💡 Pro Tips

### Keep Connection Alive
Add to your local `~/.ssh/config`:
```
Host your-server
    HostName YOUR_SERVER_IP
    User hasan181
    LocalForward 8080 localhost:8080
    ServerAliveInterval 60
    ServerAliveCountMax 10
```

Then simply connect with:
```bash
ssh your-server
```

### Multiple Ports
Forward multiple ports at once:
```bash
ssh -L 8080:localhost:8080 -L 8000:localhost:8000 hasan181@YOUR_SERVER_IP
#    └── Flutter app          └── Backend API
```

### Background SSH Tunnel
Run SSH tunnel in background:
```bash
ssh -f -N -L 8080:localhost:8080 hasan181@YOUR_SERVER_IP
```
- `-f` = background
- `-N` = no remote commands
- `-L` = port forwarding

Kill it later with:
```bash
ps aux | grep ssh
kill [PID]
```

## 🐛 Troubleshooting

### Port already in use on local machine
```bash
# Use a different local port
ssh -L 3000:localhost:8080 hasan181@YOUR_SERVER_IP
# Access at: http://localhost:3000
```

### Connection refused
- Make sure the Flutter app is running on the server (port 8080)
- Check: `netstat -tulpn | grep 8080` on the server
- Make sure your SSH connection is still active

### Can't access the page
1. Verify SSH tunnel is active
2. Verify Flutter app is running: check the terminal where you ran `./run.sh`
3. Try accessing: http://127.0.0.1:8080 instead of localhost

## 📊 Check Status

### On Server (SSH):
```bash
# Check if Flutter app is running
netstat -tulpn | grep 8080
# or
lsof -i :8080
```

### On Local Machine:
```bash
# Check if port forwarding is active
netstat -an | grep 8080
# or on Mac/Linux
lsof -i :8080
```

## 🎯 Quick Reference

| What | Where | Command |
|------|-------|---------|
| Start SSH tunnel | Local Machine | `ssh -L 8080:localhost:8080 user@server` |
| Run Flutter app | Server (SSH) | `cd reviewinn-mobile && ./run.sh` |
| View app | Local Browser | http://localhost:8080 |
| Hot reload | Server Terminal | Press 'r' |
| Stop app | Server Terminal | Press 'q' |

## 🔐 Security Note

The app is only accessible through the SSH tunnel, making it secure. No ports are exposed to the internet.
