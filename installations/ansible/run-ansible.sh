#!/bin/bash
inventory=inventory.cfg
playbook=playbook-ubuntu22.yaml

ansible-playbook -i $inventory $playbook $1 \