# Investigation Plan: Delayed Instance Termination

## Phase 1: Immediate Data Collection (Next Deployment)

### 1.1 CloudFormation Events Monitoring
```bash
# Monitor stack events in real-time during deployment
aws cloudformation describe-stack-events --stack-name <STACK_NAME> --query "StackEvents[0:10].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]" --output table

# Check for any resource failures or warnings
```

### 1.2 Instance System Logs
```bash
# Check system logs via AWS Console or CLI
aws ec2 get-console-output --instance-id <INSTANCE_ID>

# Look for system-level errors, kernel panics, or resource exhaustion
```

### 1.3 UserData Script Execution Tracking
```bash
# Monitor user-data execution (if SSH becomes available)
ssh -i apollo-demo-key.pem ec2-user@<IP> "tail -f /var/log/user-data.log"
ssh -i apollo-demo-key.pem ec2-user@<IP> "cat /var/log/deployment-errors.log"
ssh -i apollo-demo-key.pem ec2-user@<IP> "ls -la /tmp/deployment_status"
```

## Phase 2: Hypothesis Testing

### 2.1 GitHub Actions Investigation
**Hypothesis**: GitHub Actions workflow is triggering cleanup after detecting issues

**Tests**:
- Check if deployment was manual or via GitHub Actions
- Review GitHub Actions logs for cleanup triggers
- Test manual CloudFormation deployment vs GitHub Actions

### 2.2 Resource Exhaustion Investigation  
**Hypothesis**: t2.micro instance runs out of memory/CPU during data loading

**Tests**:
- Monitor system resources during deployment
- Check Docker container memory usage
- Test with minimal data loading

### 2.3 Data Loading Failure Investigation
**Hypothesis**: Data loading script fails and triggers shutdown

**Tests**:
- Test deployment without data loading
- Check data loading script execution logs
- Verify data files exist and are accessible

### 2.4 Network/Security Investigation
**Hypothesis**: Network timeouts or security group issues cause problems

**Tests**:
- Verify security group rules
- Check for network connectivity issues
- Test internal service communication

## Phase 3: Controlled Testing

### 3.1 Minimal Deployment Test
Create a stripped-down UserData script that only:
- Updates packages
- Installs Docker
- Runs a simple container
- Reports success

### 3.2 Progressive Enhancement Testing
Add components incrementally:
1. Basic Docker + simple container
2. Docker Compose with MeiliSearch only
3. Add API container
4. Add UI container
5. Add data loading

### 3.3 SSH Access Priority Fix
Fix SSH access to enable real-time debugging:
- Verify key pair matches
- Check SSH service status
- Test with different SSH options

## Phase 4: Alternative Approaches

### 4.1 CloudWatch Logging Integration
Add CloudWatch agent to capture detailed logs

### 4.2 Instance Connect Alternative
Use EC2 Instance Connect for debugging access

### 4.3 Simplified Architecture Test
Test with single-container deployment to isolate issues

## Tools and Commands Ready for Next Deployment

### Real-time Monitoring Commands:
```bash
# Instance state monitoring
watch -n 10 "aws ec2 describe-instances --instance-ids <ID> --query 'Reservations[0].Instances[0].State.Name'"

# Stack events monitoring  
watch -n 30 "aws cloudformation describe-stack-events --stack-name <STACK> --query 'StackEvents[0:5].[Timestamp,ResourceStatus,ResourceStatusReason]'"

# Service connectivity testing
watch -n 30 "curl -s -m 5 http://<IP>:8001/health && curl -s -m 5 http://<IP>:7700/health"
```

### Investigation Scripts:
```bash
# SSH debugging
ssh -v -i apollo-demo-key.pem ec2-user@<IP>

# Alternative SSH attempts
ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no -i apollo-demo-key.pem ec2-user@<IP>

# System resource check (if SSH works)
ssh -i apollo-demo-key.pem ec2-user@<IP> "free -h && df -h && docker stats --no-stream"
```

## Priority Actions for Next Deployment:

1. **Immediate**: Set up real-time monitoring before deployment starts
2. **Critical**: Capture CloudFormation events and console output
3. **Important**: Fix SSH access for live debugging
4. **Backup**: Prepare minimal test deployment if main deployment fails

## Success Criteria:
- [ ] Instance runs for >10 minutes without termination
- [ ] SSH access functional for debugging
- [ ] All services remain accessible
- [ ] Data loading completes successfully
- [ ] Clear identification of termination cause if it occurs

## Next Steps:
1. Set up monitoring commands before next deployment
2. Deploy and execute investigation plan
3. Analyze collected data to identify root cause
4. Implement targeted fix based on findings
