# Investigation Plan Summary - Ready for Next Deployment

## Current Status
- ✅ **Progress Made**: Instance termination fixes are partially working
- ✅ **Services Launch**: API, MeiliSearch, and UI start successfully  
- ✅ **4-5 Minute Runtime**: Instance runs successfully before termination
- ❌ **Delayed Shutdown**: Instance terminates after brief successful operation
- ❌ **SSH Access Issues**: Cannot access instance for live debugging

## Investigation Tools Ready

### 1. Real-time Monitoring Script
```bash
./monitor-deployment.sh <IP> <INSTANCE_ID> <STACK_NAME>
```
- Monitors instance state, services, SSH, and CloudFormation stack
- Provides continuous status updates
- Captures final state before termination

### 2. Minimal Test Deployment
- `test-cloudformation-minimal.yml` - Simplified CloudFormation template
- `test-userdata-minimal.sh` - Basic UserData script without Apollo complexity
- Tests core functionality: Docker, simple web server, basic system operations

### 3. Investigation Commands Ready
```bash
# Get console output for system-level errors
aws ec2 get-console-output --instance-id <INSTANCE_ID>

# Monitor CloudFormation events
aws cloudformation describe-stack-events --stack-name <STACK> --query "StackEvents[0:10]"

# Track instance state changes
watch "aws ec2 describe-instances --instance-ids <ID> --query 'Reservations[0].Instances[0].State'"
```

## Investigation Hypotheses (Priority Order)

### 1. **GitHub Actions Cleanup (High Priority)**
- **Evidence**: Consistent pattern of termination after ~5 minutes
- **Test**: Deploy manually via CloudFormation vs GitHub Actions
- **Investigation**: Check if workflow has cleanup triggers

### 2. **Data Loading Script Failure (High Priority)**  
- **Evidence**: Search API shows "Index not found" error
- **Test**: Deploy without data loading scripts
- **Investigation**: Check if data loading failure triggers shutdown

### 3. **Resource Exhaustion (Medium Priority)**
- **Evidence**: t2.micro has limited resources, Docker containers are resource-intensive
- **Test**: Monitor memory/CPU usage during deployment
- **Investigation**: Use minimal deployment to establish baseline

### 4. **SSH Key/Security Issues (Medium Priority)**
- **Evidence**: Consistent SSH permission denied errors
- **Test**: Verify key pair matches, try alternative access methods
- **Investigation**: Check if SSH issues indicate broader configuration problems

### 5. **UserData Script Logic Error (Low Priority)**
- **Evidence**: Our error handling improvements worked partially
- **Test**: Use minimal UserData script to isolate issues
- **Investigation**: Progressive enhancement testing

## Action Plan for Next Deployment

### Pre-Deployment Setup
1. **Start monitoring before deployment**:
   ```bash
   # Keep these commands ready in separate terminals
   watch -n 30 "aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]'"
   
   watch -n 30 "aws cloudformation list-stacks --stack-status-filter CREATE_IN_PROGRESS CREATE_COMPLETE"
   ```

2. **Have investigation commands ready**:
   ```bash
   # Replace with actual values when deployment starts
   IP="<DEPLOYMENT_IP>"
   INSTANCE_ID="<INSTANCE_ID>"  
   STACK_NAME="<STACK_NAME>"
   ```

### During Deployment
1. **Immediate monitoring**:
   ```bash
   ./monitor-deployment.sh $IP $INSTANCE_ID $STACK_NAME
   ```

2. **Capture console output early**:
   ```bash
   aws ec2 get-console-output --instance-id $INSTANCE_ID > console-output.txt
   ```

3. **Test services as soon as available**:
   ```bash
   curl http://$IP:8001/health
   curl http://$IP:7700/health  
   curl http://$IP:8080
   ```

### If Termination Occurs
1. **Immediate data capture**:
   ```bash
   aws ec2 get-console-output --instance-id $INSTANCE_ID > termination-console-$(date +%s).txt
   aws cloudformation describe-stack-events --stack-name $STACK_NAME > stack-events-$(date +%s).json
   ```

2. **Analyze termination reason**:
   - Check CloudFormation events for resource failures
   - Review console output for system errors
   - Check if stack deletion was triggered

## Alternative Testing Strategy

If main deployment continues to fail, we can test with minimal deployment:

```bash
# Deploy minimal test
aws cloudformation create-stack \
  --stack-name apollo-minimal-test \
  --template-body file://test-cloudformation-minimal.yml \
  --parameters ParameterKey=KeyPairName,ParameterValue=apollo-demo-key

# Monitor minimal deployment  
./monitor-deployment.sh <MINIMAL_IP> <MINIMAL_INSTANCE_ID> apollo-minimal-test
```

## Success Criteria for Investigation
- [ ] Identify specific cause of delayed termination
- [ ] Achieve >10 minute stable runtime
- [ ] Establish SSH access for debugging
- [ ] Determine if issue is GitHub Actions, resource limits, or script logic
- [ ] Create targeted fix based on root cause analysis

## Files Ready for Investigation
- `INVESTIGATION_PLAN.md` - Detailed investigation methodology
- `monitor-deployment.sh` - Real-time monitoring script
- `test-cloudformation-minimal.yml` - Minimal test template
- `test-userdata-minimal.sh` - Simplified UserData script

The investigation is well-prepared. When you're ready for the next deployment, we can execute this plan systematically to identify and fix the remaining termination issue.
