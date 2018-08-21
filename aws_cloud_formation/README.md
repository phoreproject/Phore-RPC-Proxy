# How to set up on AWS

Templates don't include creation of S3 bucket which is necessary for one of services. Bucket is used as cache for phored 
blocks data storage.

## Use AWS cloud formation to create our stacks (order is important).
- ### Create basic services (createVpcAndLoadBalancers.yaml):
    * VPC (virtual private cloud), 
    * subnets:
        - private,
        - public 
        
        Both are duplicated in case of failure one of them.
    * internet gateway for send traffic from public subnets,
    * NAT gateway for send data from private subnets,
    * ECS cluster,
    * Fargate security groups - it allows to connect to Fargate containers from public load balancer, private load 
    balancer and other members of the security group,
    * Load balancers:
        - public - hosted in public subnets (is accessible from the internet). It is intended to route traffic to 
        services in public subnets,    
        - private - hosted in private subnets, that accept traffic from other containers in Fargate cluster and is
        intended for private services not accessible from the public,
        - public LB security group - access to LB from entire internet,
        - public LB target group - drop all traffic in this moment,
        - private LB security group - access to LB only from Fargate security group,
        - private LB target group - drop all traffic in this moment,
        - and other... 
    * ECS role - allow this cloud template to create resources like LB,
    * ECS task execution role - allow Fargate task to download container images from ECR and access CloudWatch,
    * ECS task S3 acccess role - allow Fargate containers to access S3 buckets without specify API keys,
    * Redis cluster:
        - subnets group - attach redis service into private subnets,
        - cluster itself - cluster configuration like Redis version, node size, number of nodes etc,
    
- ### Create KeepPhoreUpdated service (createKeepPhoreUpdatedService.yaml):
    This service have always only 1 instance. This instance is periodically restarted to keep files with phored database
    updated. Every few hours database is updated to S3 bucket. It allows new instances of phored to start much faster,
    without downloading entire blockchain from other nodes instead they can download cached data from local network.
    
    * task definition - use task execution and S3 access role from previous template,
    * service definition - specify parameters necessary to run task. It attach load balancers, security groups and 
    set used subnets,
    * target groups - attach service to public load balancer. This allows other public nodes toexchange blockchain data,


- ### Create Phroed service (createPhoredService.yaml):
    This is most important part of RPC. This template create phored instances responsible for RPC responses either from
    the internet and from other containers.
    Service is similar to previous one, except there is more environment variables set and more ports are open (RPC 
    port, http port for easy access from the public and port for connection with other phored nodes from outside).
    
- ### Create Websocket service (createWebsocketApp.yaml):
    This service is responsible for websocket subscriptions. Tasks from that service are able to connect to internal 
    phored services by private LB. Service again is really similar to previous ones, but have more dependencies for 
    other services. To work needs correctly configured Phored service.
 