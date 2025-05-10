# DEPLOYMENT

## Prerequisitions

- Install Ansible and Boto3, `pip install ansible boto3`
- Valid AWS credential
- Create a correct all.yml from all.example


## From Local to AwS

### Precheck:

1. checklist .env in backend and client in prod status:

- `VITE_MODE="PROD"`
- `VITE_AUTH_DISABLED=false`
- `USE_FAKE_AUTH=False`
- `VITE_API_URL=<server-api>`

2. Docker is running on your local

3. Run `cd backend && docker-compose --file docker-compose-prod.yaml build amark-api`

### Deploy Steps:

- Step1 (for sso login user): `aws sso login --profile <your profile>` and `export AWS_PROFILE=<your-profile>`
- Step2: `cd ansible && source <your ansible virtual env>/bin/activate`
- Step3 (optional, check steps): `ansible-playbook main_client.yml --check` and `ansible-playbook inventory.yml main_backend.yml`
- Step4: `ansible-playbook main_client.yml --check` and `ansible-playbook inventory.yml main_backend.yml`
