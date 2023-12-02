#!/bin/bash
inventory=inventory.cfg
host=fdmm

echo "Listing ansible hosts from inventory file '$inventory'"
ansible -i $inventory $host --list-hosts $1
ansible -i $inventory $host -m ping $1
ansible -i $inventory $host -a 'free -h' $1