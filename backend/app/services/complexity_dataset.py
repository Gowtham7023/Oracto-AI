TRAINING_DATA = [

    # =======================================================================
    # SIMPLE  (72 examples)
    # Definitions, conversions, short factual, simple programming, basic lists
    # =======================================================================

    # Definitions
    ("What is Python?", "simple"),
    ("What is Java?", "simple"),
    ("Define machine learning.", "simple"),
    ("What is an API?", "simple"),
    ("Define SQL.", "simple"),
    ("What is inheritance?", "simple"),
    ("What is a database?", "simple"),
    ("What is HTTP?", "simple"),
    ("What is a variable?", "simple"),
    ("What is a function?", "simple"),
    ("What is an operating system?", "simple"),
    ("What is HTML?", "simple"),
    ("What is CSS?", "simple"),
    ("What is Git?", "simple"),
    ("What is JSON?", "simple"),
    ("What is Docker?", "simple"),
    ("What is a compiler?", "simple"),
    ("What is an interpreter?", "simple"),
    ("What is recursion?", "simple"),
    ("What is a linked list?", "simple"),
    ("What is a hash table?", "simple"),
    ("What is a REST API?", "simple"),
    ("What is TypeScript?", "simple"),
    ("What is a boolean?", "simple"),
    ("What is an integer?", "simple"),
    ("What is a string in programming?", "simple"),
    ("What is an IP address?", "simple"),
    ("What is DNS?", "simple"),
    ("What is an algorithm?", "simple"),
    ("What is a constant in programming?", "simple"),

    # Conversions
    ("Convert 10 meters to centimeters.", "simple"),
    ("Convert 100 dollars to rupees.", "simple"),
    ("Convert 5 kilometers to miles.", "simple"),
    ("Convert 32 Fahrenheit to Celsius.", "simple"),
    ("Convert 100 Celsius to Fahrenheit.", "simple"),
    ("Convert 1024 bytes to kilobytes.", "simple"),
    ("Convert 2 hours to minutes.", "simple"),

    # Short factual questions
    ("Who created Python?", "simple"),
    ("Who invented the internet?", "simple"),
    ("What year was JavaScript created?", "simple"),
    ("What does CPU stand for?", "simple"),
    ("What does RAM stand for?", "simple"),
    ("What does GPU stand for?", "simple"),
    ("What is the latest version of Python?", "simple"),
    ("Who founded Microsoft?", "simple"),
    ("What language is the Linux kernel written in?", "simple"),
    ("What port does HTTP use by default?", "simple"),
    ("What is the file extension for Python files?", "simple"),

    # Simple programming questions
    ("Write a hello world program in Python.", "simple"),
    ("How do you print a string in JavaScript?", "simple"),
    ("What is the syntax for a for loop in Java?", "simple"),
    ("How do you declare a variable in C?", "simple"),
    ("Write a function that adds two numbers in Python.", "simple"),
    ("How do you create a list in Python?", "simple"),
    ("What is the difference between == and === in JavaScript?", "simple"),
    ("How do you comment code in Python?", "simple"),
    ("What is a constructor in Java?", "simple"),
    ("How do you import a module in Python?", "simple"),
    ("How do you define a function in Python?", "simple"),

    # Basic explanations
    ("Explain what a loop does.", "simple"),
    ("Explain what an array is.", "simple"),
    ("Explain what a stack is.", "simple"),
    ("Explain what a queue is.", "simple"),
    ("What does the print function do in Python?", "simple"),

    # Simple lists
    ("List three fruits.", "simple"),
    ("List five programming languages.", "simple"),
    ("Name three web browsers.", "simple"),
    ("List four data types in Python.", "simple"),
    ("Name three database management systems.", "simple"),
    ("List three version control systems.", "simple"),
    ("Name five countries in Asia.", "simple"),
    ("Name four seasons of the year.", "simple"),


    # =======================================================================
    # MODERATE  (72 examples)
    # Comparisons, summaries, structured explanations, study plans,
    # basic code generation, data analysis, API explanations, pros/cons
    # =======================================================================

    # Comparisons
    ("Compare Python and Java in a table.", "moderate"),
    ("Compare Python and Java including advantages and disadvantages.", "moderate"),
    ("Compare SQL and NoSQL databases.", "moderate"),
    ("Compare PostgreSQL and MySQL for web applications.", "moderate"),
    ("Compare React and Angular for frontend development.", "moderate"),
    ("Compare arrays and linked lists in a table.", "moderate"),
    ("Compare REST API and GraphQL based on common use cases.", "moderate"),
    ("Compare Docker and virtual machines.", "moderate"),
    ("Compare Git and SVN for version control.", "moderate"),
    ("Compare monolithic and microservices architectures.", "moderate"),
    ("Compare relational and document databases.", "moderate"),
    ("Compare TensorFlow and PyTorch for deep learning.", "moderate"),
    ("Compare agile and waterfall project management.", "moderate"),
    ("Compare TCP and UDP protocols with use cases.", "moderate"),
    ("Compare REST and gRPC with practical examples.", "moderate"),
    ("Compare microservices and serverless architectures.", "moderate"),
    ("Summarize the key differences between SQL and NoSQL databases.", "moderate"),

    # Summaries
    ("Summarize this article in five bullet points.", "moderate"),
    ("Summarize the key features of Kubernetes.", "moderate"),
    ("Summarize the main concepts of object-oriented programming.", "moderate"),
    ("Summarize the benefits of cloud computing in a paragraph.", "moderate"),
    ("Summarize how DNS resolution works.", "moderate"),

    # Structured explanations
    ("Explain the difference between REST and SOAP.", "moderate"),
    ("Explain how a REST API works with an example.", "moderate"),
    ("Explain the difference between TCP and UDP.", "moderate"),
    ("Explain supervised and unsupervised learning with examples.", "moderate"),
    ("Explain the difference between classification and regression.", "moderate"),
    ("Explain how authentication works in a web application.", "moderate"),
    ("Explain the MVC design pattern with an example.", "moderate"),
    ("Explain how garbage collection works in Java.", "moderate"),
    ("Explain the CAP theorem with examples.", "moderate"),
    ("Explain how HTTPS works step by step.", "moderate"),
    ("Explain the difference between threads and processes.", "moderate"),
    ("Explain how a load balancer works.", "moderate"),
    ("Explain event-driven architecture with a real-world example.", "moderate"),
    ("Explain how indexing improves database search speed.", "moderate"),
    ("Explain the difference between synchronous and asynchronous programming.", "moderate"),
    ("Explain how cookies and sessions work in web browsers.", "moderate"),
    ("Explain the purpose of continuous integration and continuous delivery.", "moderate"),

    # Study plans
    ("Create a structured study plan for learning Java.", "moderate"),
    ("Create a weekly plan for learning Python.", "moderate"),
    ("Design a 30-day learning roadmap for web development.", "moderate"),
    ("Create a study plan for learning data structures and algorithms.", "moderate"),
    ("Create a weekly routine for learning machine learning fundamentals.", "moderate"),

    # Basic code generation
    ("Write a Python function that checks if a number is prime.", "moderate"),
    ("Write a function to reverse a string in JavaScript.", "moderate"),
    ("Write a Python class for a simple bank account.", "moderate"),
    ("Create a basic CRUD API using Flask.", "moderate"),
    ("Write a SQL query to find duplicate records in a table.", "moderate"),
    ("Write a Python script that reads a CSV file and prints the headers.", "moderate"),
    ("Create a simple to-do list application in Python.", "moderate"),
    ("Write a function to find the factorial of a number recursively.", "moderate"),
    ("Write a Python script to count word occurrences in a text file.", "moderate"),
    ("Write a function to check if a string is a palindrome.", "moderate"),

    # Data analysis and API explanations
    ("Analyze customer feedback and identify common themes.", "moderate"),
    ("Analyze these results and summarize the main findings.", "moderate"),
    ("Analyze survey data and identify key customer pain points.", "moderate"),
    ("Explain how OAuth 2.0 authorization works.", "moderate"),
    ("Explain how JWT tokens work for API authentication.", "moderate"),
    ("Explain the difference between horizontal and vertical scaling.", "moderate"),

    # Pros/cons and multi-part bounded tasks
    ("Explain the advantages and disadvantages of cloud computing.", "moderate"),
    ("List the pros and cons of using microservices.", "moderate"),
    ("List the pros and cons of NoSQL databases.", "moderate"),
    ("Create a simple database schema for a library system.", "moderate"),
    ("Design a database schema for a blog with users, posts, and comments.", "moderate"),
    ("Explain three common sorting algorithms and their time complexity.", "moderate"),
    ("Describe the SOLID principles with brief examples.", "moderate"),
    ("Explain the observer design pattern with a practical example.", "moderate"),
    ("Write a Python function to merge two sorted lists.", "moderate"),
    ("Explain how caching improves application performance.", "moderate"),
    ("List and explain five common HTTP status codes.", "moderate"),


    # =======================================================================
    # COMPLEX  (72 examples)
    # System architecture, distributed systems, security architecture,
    # ML pipelines, fraud detection, financial analysis, multi-step design,
    # scalability, reliability, optimization, multi-constraint problems
    # =======================================================================

    # System architecture
    (
        "Design a scalable microservices architecture for a banking system "
        "with authentication, fraud detection, monitoring, and disaster recovery.",
        "complex",
    ),
    (
        "Design a highly available cloud architecture for an enterprise "
        "application with microservices, load balancing, caching, databases, "
        "observability, disaster recovery, and automated deployment.",
        "complex",
    ),
    (
        "Develop a detailed architecture for an AI platform that routes "
        "requests across multiple LLM providers while maintaining quality "
        "and minimizing cost.",
        "complex",
    ),
    (
        "Design an intelligent LLM routing system that dynamically selects "
        "models based on complexity, cost, latency, quality, availability, "
        "verification results, and automatic escalation.",
        "complex",
    ),
    (
        "Design a secure multi-tenant SaaS platform with authentication, "
        "authorization, tenant isolation, encryption, audit logging, "
        "scalability, monitoring, and disaster recovery.",
        "complex",
    ),
    (
        "Architect a real-time data processing platform using Kafka, Spark, "
        "and a data lake with schema evolution, monitoring, and fault tolerance.",
        "complex",
    ),
    (
        "Design a global content delivery system with edge caching, origin "
        "shielding, failover, purging, analytics, and DDoS protection.",
        "complex",
    ),
    (
        "Design a multi-region database architecture with replication, "
        "conflict resolution, failover, consistency guarantees, and compliance.",
        "complex",
    ),

    # Distributed systems
    (
        "Analyze a distributed system and identify security, scalability, "
        "performance, and reliability risks with mitigation strategies.",
        "complex",
    ),
    (
        "Design a distributed task scheduling system with priority queues, "
        "retry policies, dead letter queues, monitoring, and horizontal scaling.",
        "complex",
    ),
    (
        "Design a distributed event sourcing system with CQRS, event replay, "
        "snapshotting, schema evolution, and eventual consistency guarantees.",
        "complex",
    ),
    (
        "Architect a distributed search engine with indexing, ranking, sharding, "
        "replication, query optimization, and real-time updates.",
        "complex",
    ),
    (
        "Design a fault-tolerant distributed cache system with consistent hashing, "
        "LRU eviction, replication, and network partition handling.",
        "complex",
    ),
    (
        "Design a distributed telemetry and distributed tracing platform handling "
        "millions of spans per second with sampling, indexing, and storage optimization.",
        "complex",
    ),

    # Security architecture
    (
        "Evaluate the security architecture of a distributed application "
        "and propose improvements for authentication, authorization, "
        "encryption, threat detection, and incident response.",
        "complex",
    ),
    (
        "Design a zero-trust security architecture for a cloud-native "
        "application including identity management, network segmentation, "
        "encryption, monitoring, and automated threat response.",
        "complex",
    ),
    (
        "Create a comprehensive security audit plan for a financial application "
        "covering code review, penetration testing, compliance, access controls, "
        "data protection, and incident response.",
        "complex",
    ),
    (
        "Design an API security framework with rate limiting, authentication, "
        "input validation, encryption, audit logging, and abuse detection.",
        "complex",
    ),
    (
        "Architect a scalable multi-region identity provider supporting OAuth2, "
        "OIDC, SAML, WebAuthn, risk-based adaptive authentication, and compliance.",
        "complex",
    ),

    # ML pipelines
    (
        "Design an end-to-end machine learning pipeline including data "
        "preprocessing, feature engineering, model selection, deployment, "
        "monitoring, and retraining.",
        "complex",
    ),
    (
        "Develop an end-to-end recommendation system covering data pipelines, "
        "feature engineering, model training, online inference, monitoring, "
        "A/B testing, scalability, and model retraining.",
        "complex",
    ),
    (
        "Build an AI-powered document processing pipeline involving OCR, "
        "document classification, information extraction, validation, "
        "human review, storage, monitoring, and model improvement.",
        "complex",
    ),
    (
        "Design a natural language processing pipeline for sentiment analysis "
        "at scale including data collection, annotation, model training, "
        "deployment, monitoring, and continuous improvement.",
        "complex",
    ),
    (
        "Design an MLOps platform with experiment tracking, model registry, "
        "automated training, deployment pipelines, monitoring, rollback, "
        "and governance.",
        "complex",
    ),
    (
        "Create a computer vision pipeline for manufacturing defect detection "
        "including data labeling, augmentation, model training, edge deployment, "
        "real-time inference, and feedback loops.",
        "complex",
    ),
    (
        "Design an automated model retraining and concept drift detection pipeline "
        "for credit default prediction with rollback and governance.",
        "complex",
    ),
    (
        "Design a secure federated learning infrastructure for cross-institutional "
        "medical data analysis with differential privacy and tamper-proof auditing.",
        "complex",
    ),

    # Fraud detection
    (
        "Compare multiple approaches to real-time fraud detection and "
        "design an architecture considering latency, cost, accuracy, "
        "security, and scalability.",
        "complex",
    ),
    (
        "Design a production-ready real-time payment fraud detection "
        "system including streaming, feature engineering, machine learning, "
        "database design, monitoring, alerting, and failover.",
        "complex",
    ),
    (
        "Develop a complete fraud detection architecture that processes "
        "millions of transactions, performs real-time risk scoring, "
        "supports model retraining, provides explainability, and maintains "
        "high availability.",
        "complex",
    ),
    (
        "Design an anti-money laundering system with transaction monitoring, "
        "suspicious activity reporting, graph analysis, regulatory compliance, "
        "and case management.",
        "complex",
    ),

    # Financial transaction analysis
    (
        "Analyze a financial transaction network to detect suspicious "
        "behavior using graph algorithms, anomaly detection, risk scoring, "
        "case management, explainability, and real-time processing.",
        "complex",
    ),
    (
        "Design a credit risk assessment platform integrating multiple "
        "data sources, feature engineering, model training, regulatory "
        "compliance, explainability, and real-time scoring.",
        "complex",
    ),
    (
        "Create a real-time trading platform architecture with order matching, "
        "market data feeds, risk management, compliance, low latency, "
        "and high availability.",
        "complex",
    ),
    (
        "Design a high-frequency trading risk engine with real-time portfolio "
        "valuation, margin checks, latency guarantees, and failover.",
        "complex",
    ),

    # Multi-step engineering design
    (
        "Evaluate multiple machine learning algorithms for a production "
        "fraud detection problem considering class imbalance, precision, "
        "recall, latency, explainability, cost, deployment, and monitoring.",
        "complex",
    ),
    (
        "Design a CI/CD pipeline for a microservices application including "
        "building, testing, security scanning, deployment, rollback, monitoring, "
        "and multi-environment promotion.",
        "complex",
    ),
    (
        "Design a real-time analytics dashboard system with data ingestion, "
        "stream processing, aggregation, storage, visualization, alerting, "
        "and role-based access control.",
        "complex",
    ),
    (
        "Architect a serverless application with event-driven workflows, "
        "state management, error handling, observability, cost optimization, "
        "and cold start mitigation.",
        "complex",
    ),
    (
        "Design an AI agent orchestration system that plans, executes, evaluates "
        "multi-step workflows with tool use, sandboxing, and budget constraints.",
        "complex",
    ),

    # Scalability and reliability
    (
        "Design a database migration strategy for moving from a monolithic "
        "database to microservices-based databases with zero downtime, data "
        "consistency, rollback plans, and validation.",
        "complex",
    ),
    (
        "Design a chaos engineering framework for testing distributed systems "
        "including failure injection, steady-state analysis, blast radius "
        "control, automated rollback, and reporting.",
        "complex",
    ),
    (
        "Design a multi-cloud disaster recovery strategy with RPO and RTO "
        "targets, data replication, failover automation, testing procedures, "
        "and cost optimization.",
        "complex",
    ),
    (
        "Architect a high-throughput message processing system supporting "
        "millions of messages per second with ordering guarantees, exactly-once "
        "delivery, backpressure handling, and monitoring.",
        "complex",
    ),
    (
        "Architect an enterprise-grade disaster recovery solution with geo-replication, "
        "automated failover testing, RPO/RTO tracking, and auditability.",
        "complex",
    ),
    (
        "Design an automated incident detection and remediation system with "
        "anomaly detection, root cause analysis, playbooks, and verification.",
        "complex",
    ),

    # Optimization
    (
        "Design a cost optimization strategy for a large-scale cloud deployment "
        "covering compute, storage, networking, reserved instances, spot instances, "
        "monitoring, and automated rightsizing.",
        "complex",
    ),
    (
        "Design an auto-scaling architecture for a web application that handles "
        "traffic spikes with predictive scaling, warm pools, database connection "
        "management, and cost controls.",
        "complex",
    ),
    (
        "Optimize a large-scale data warehouse for query performance including "
        "partitioning, indexing, materialized views, caching, query rewriting, "
        "and resource management.",
        "complex",
    ),

    # Detailed technical analysis
    (
        "Perform a detailed technical comparison of Kafka, RabbitMQ, and Pulsar "
        "for a high-throughput event streaming platform considering performance, "
        "durability, scalability, operations, and ecosystem.",
        "complex",
    ),
    (
        "Perform a comprehensive analysis of different database technologies "
        "for a social media platform handling billions of records with varying "
        "access patterns, consistency requirements, and scaling needs.",
        "complex",
    ),
    (
        "Evaluate container orchestration platforms including Kubernetes, "
        "Docker Swarm, and Nomad for enterprise workloads considering "
        "scalability, security, operations, ecosystem, and cost.",
        "complex",
    ),

    # Multi-constraint design problems
    (
        "Design a healthcare data platform that complies with HIPAA, supports "
        "real-time patient monitoring, integrates with EHR systems, provides "
        "analytics, ensures data privacy, and handles failover.",
        "complex",
    ),
    (
        "Design an IoT platform for smart city management including device "
        "management, data ingestion, edge computing, analytics, alerting, "
        "security, and scalability to millions of devices.",
        "complex",
    ),
    (
        "Design a video streaming platform architecture with transcoding, "
        "adaptive bitrate streaming, CDN integration, DRM, analytics, "
        "recommendation engine, and global low-latency delivery.",
        "complex",
    ),
    (
        "Design a supply chain optimization system with demand forecasting, "
        "inventory management, route optimization, supplier management, "
        "real-time tracking, and exception handling.",
        "complex",
    ),
    (
        "Design a regulatory compliance platform for financial services "
        "with automated report generation, rule management, audit trails, "
        "risk assessment, and multi-jurisdiction support.",
        "complex",
    ),
    (
        "Design an enterprise identity and access management system with SSO, "
        "MFA, RBAC, ABAC, federation, directory integration, audit logging, "
        "and self-service capabilities.",
        "complex",
    ),
    (
        "Design a large-scale log aggregation and analysis platform "
        "handling terabytes of daily logs with real-time search, alerting, "
        "retention policies, anomaly detection, and multi-tenancy.",
        "complex",
    ),
    (
        "Build a production-ready feature store for machine learning with "
        "online and offline serving, feature versioning, data validation, "
        "monitoring, access control, and integration with training pipelines.",
        "complex",
    ),
    (
        "Design a conversational AI platform with multi-turn dialog management, "
        "intent recognition, entity extraction, context handling, escalation "
        "to humans, analytics, and continuous learning.",
        "complex",
    ),
    (
        "Architect a data governance platform with data cataloging, lineage "
        "tracking, quality monitoring, access control, compliance reporting, "
        "and automated policy enforcement.",
        "complex",
    ),
    (
        "Design a real-time bidding platform for digital advertising with "
        "sub-millisecond latency, bid optimization, budget management, fraud "
        "detection, reporting, and compliance with privacy regulations.",
        "complex",
    ),
    (
        "Design an autonomous vehicle data processing pipeline with sensor "
        "fusion, real-time inference, simulation, data labeling, model training, "
        "over-the-air updates, and safety validation.",
        "complex",
    ),
    (
        "Design a blockchain-based supply chain traceability system with "
        "smart contracts, off-chain storage, privacy controls, interoperability, "
        "performance optimization, and regulatory compliance.",
        "complex",
    ),
    (
        "Architect a multi-modal AI system that processes text, images, and "
        "audio with unified embeddings, cross-modal retrieval, model serving, "
        "quality evaluation, and cost management at scale.",
        "complex",
    ),
    (
        "Design a platform for running reproducible scientific experiments "
        "at scale with compute orchestration, data versioning, experiment "
        "tracking, collaboration, publishing, and cost management.",
        "complex",
    ),
    (
        "Design an automated infrastructure provisioning system with "
        "infrastructure as code, drift detection, compliance validation, "
        "cost tracking, approval workflows, and multi-cloud support.",
        "complex",
    ),
    (
        "Create a comprehensive API gateway architecture with rate limiting, "
        "request transformation, authentication, caching, circuit breaking, "
        "analytics, developer portal, and multi-protocol support.",
        "complex",
    ),
    (
        "Design a digital twin platform for industrial equipment with "
        "real-time sensor integration, simulation models, predictive "
        "maintenance, anomaly detection, visualization, and alerting.",
        "complex",
    ),
    (
        "Design a petabyte-scale data lakehouse architecture with ACID transactions, "
        "time travel, schema enforcement, and cost-effective tiered storage.",
        "complex",
    ),
]

