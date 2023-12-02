#!/bin/bash
inventory=inventory.cfg
playbook_mongo=playbook-mongodb6.yaml
playbook=playbook-ubuntu22.yaml

ansible-playbook -i $inventory $playbook_mongo $1 $2
ansible-playbook -i $inventory $playbook $1 $2