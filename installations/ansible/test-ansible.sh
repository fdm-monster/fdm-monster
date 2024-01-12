#!/bin/bash
inventory=inventory.cfg
host=fdmm
playbook=test-installation.yaml

echo "Listing ansible hosts from inventory file '$inventory'"
ansible -i $inventory $host --list-hosts $1 $2
ansible -i $inventory $host -m ping $1 $2
ansible -i $inventory $host -a 'free -h' $1 $2
ansible-playbook -i $inventory $playbook $1 $2