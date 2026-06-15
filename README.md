# 🚑 Emergency Vehicle Priority System (Green Corridor) 🚦

*AI-Enhanced, IoT-Integrated Solution for Real-Time Emergency Vehicle Prioritization*

---

## 📖 About the Project

**Emergency Vehicle Priority System**, also known as the **"Green Corridor Protocol"**, is an innovative solution designed to improve emergency response efficiency in urban environments. The system addresses a critical problem: emergency vehicles like ambulances and fire trucks face significant delays due to traffic congestion, leading to increased response times and potential loss of life.

This project introduces a **centralized, real-time emergency traffic management framework** that combines:
- **Intelligent Route Optimization** using AI-driven algorithms
- **Dynamic Traffic Signal Control** through V2I (Vehicle-to-Infrastructure) communication
- **Real-Time Coordination** between Command Center, drivers, and traffic infrastructure
- **IoT Integration** for simulating adaptive traffic control systems

The system demonstrates how coordinated command-and-control, intelligent routing, and infrastructure-level communication can create efficient emergency traffic management solutions.

### Core Objectives

1. **Centralized Command and Control Workflow** - Enable real-time approval and coordination of emergency trips
2. **Dynamic Route Generation** - Generate optimal routes and synchronize them across all interfaces
3. **V2I-Based Traffic Signal Preemption** - Automatically switch traffic signals to GREEN when emergency vehicles approach junctions
4. **Real-Time Communication** - Establish uninterrupted WebSocket-based communication between all system components

---

## 🌟 Key Features

### 🚨 Emergency Vehicle Routing
- **Intelligent Route Optimization**: Uses graph-based algorithms (Dijkstra) for shortest path computation
- **Real-Time Synchronization**: Routes are synchronized across driver and command center dashboards
- **Dynamic Updates**: Routes adapt based on system state and vehicle movement

### 🚦 Junction-Based Signal Preemption
- **Geofencing Logic**: Proximity-based detection around traffic junctions
- **Automatic Signal Control**: Switches traffic lights from RED to GREEN as vehicles approach
- **Minimized Delays**: Reduces stoppage time at intersections

### 📡 Dual-Interface Architecture
- **Command Center Dashboard**: Centralized monitoring and control of emergency operations
- **Driver Interface**: Real-time route visualization and trip management
- **Synchronized Visibility**: Both interfaces maintain consistent, real-time data

### 🤖 V2X & IoT Integration
- **Vehicle-to-Infrastructure Communication**: Simulates real-world traffic infrastructure interaction
- **ESP32 Mock ATCS**: Demonstrates Adaptive Traffic Control System integration
- **Event-Driven Architecture**: Low-latency, real-time synchronization using WebSocket

### 🛑 Real-Time Alerts & Monitoring
- **Live Vehicle Tracking**: Continuous position updates on interactive maps
- **Signal Status Monitoring**: Real-time display of traffic signal states
- **Time Metrics**: Shows estimated time saved during emergency trips

---

## 🏗️ System Architecture

The system follows a **layered, modular architecture** designed for scalability and extensibility:

```
┌─────────────────────────────────────────────────────────────┐
│              CLIENT INTERFACE LAYER (Frontend)              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  Command Center      │      │   Driver Interface   │    │
│  │  Dashboard (Admin)   │      │  (Emergency Vehicle) │    │
│  └──────────────────────┘      └──────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│      REAL-TIME COMMUNICATION LAYER (WebSocket/Socket.IO)    │
│  • Trip Requests • Approvals • Route Updates • Tracking     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│   APPLICATION & CONTROL LAYER (Node.js/Express Backend)    │
│  • Route Generation • Authentication • Event Handling       │
│  • State Management • Real-Time Coordination                │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│        IoT SIMULATION LAYER (ESP32 Mock ATCS)               │
│  • Vehicle Proximity Monitoring • Signal Preemption         │
│  • Geofencing Logic • Infrastructure Interaction            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  COMPUTATIONAL & ANALYTICAL LAYER (Optional Extension)      │
│  • Multi-Route Optimization • Traffic Prediction            │
│  • Hospital Selection • Decision Support Systems            │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Layers

**1. Client Interface Layer**
- Command Center Dashboard for centralized monitoring
- Driver Interface for route visualization and trip management
- Interactive map-based visualization using MapLibre GL JS

**2. Real-Time Communication Layer**
- WebSocket-based bidirectional communication
- Socket.IO for low-latency event transmission
- Synchronization of trip requests, approvals, and vehicle updates

**3. Application & Control Layer**
- Node.js/Express backend for core logic
- Route generation and management
- User authentication and session handling
- System state coordination

**4. IoT Simulation Layer**
- ESP32 as mock Adaptive Traffic Control System
- Geofencing-based signal triggering
- Simulation of Vehicle-to-Infrastructure communication

**5. Computational & Analytical Layer (Optional)**
- Flask-based modules for advanced features
- Multi-route optimization algorithms
- Machine learning for traffic prediction
- Hospital selection using distance matrices

---

## 🚀 Technology Stack

| Component | Technologies/Standards |
|-----------|------------------------|
| **Frontend Framework** | Next.js (React), TypeScript |
| **Map Visualization** | MapLibre GL JS |
| **Styling** | Tailwind CSS |
| **Backend Framework** | Node.js, Express.js |
| **Real-Time Communication** | WebSocket, Socket.IO |
| **Database** | MongoDB (MongoDB Atlas) |
| **IoT/Simulation** | ESP32, Arduino IDE |
| **Optional Computational** | Flask (Python) |
| **Version Control** | Git, GitHub |
| **Communication Standards** | IEEE 802.11p, IEEE 1609, WebSocket Protocol |

---

## 🎯 System Workflow

### Step-by-Step Operation

1. **Trip Initiation** (Driver Interface)
   - Driver logs in and enters source & destination
   - Trip request is generated and sent to backend

2. **Real-Time Request Transmission**
   - Request instantly transmitted to Command Center Dashboard via WebSocket
   - Minimal delay ensures immediate visibility

3. **Command Center Approval**
   - Administrator reviews incoming request
   - Approves trip, triggering route generation

4. **Route Generation & Synchronization**
   - Optimal route computed and displayed
   - Route synchronized across both driver and admin interfaces

5. **Trip Start & Real-Time Tracking**
   - Driver initiates trip
   - System begins continuous position tracking

6. **Junction Monitoring & Geofencing**
   - Junctions identified and monitored along route
   - Geofencing zones defined around each junction

7. **Traffic Signal Preemption (IoT)**
   - Vehicle enters proximity zone
   - Signal sent to ESP32 mock ATCS
   - Traffic signal transitions RED → GREEN

8. **Continuous Synchronization**
   - All events synchronized in real-time
   - Vehicle movement, signal changes, system updates

9. **Optional Advanced Features**
   - Multi-route evaluation
   - Hospital selection support
   - Decision-support integration

---

## 🧮 Core Algorithms & Techniques

### Dynamic Route Optimization
- **Algorithm**: Graph-based Dijkstra's shortest path
- **Implementation**: Road network modeled as weighted graph
- **Efficiency**: Balance between computational speed and accuracy
- **Advantage**: Real-time suitability for emergency scenarios

### V2I Geofencing & Signal Preemption
- **Mechanism**: Virtual geofencing around traffic junctions
- **Proximity Detection**: Continuous monitoring of vehicle position
- **Trigger Logic**: Automatic signal state change when vehicle enters zone
- **IoT Simulation**: ESP32 mimics real Adaptive Traffic Control System (ATCS)

### Distance Matrix for Hospital Selection
- **Multi-Criteria Evaluation**: Considers distance, travel time, traffic conditions
- **Decision Support**: Enables flexible emergency planning
- **Extensibility**: Can integrate external APIs for hospital data

---

## 📊 Project Team

**Submitted in partial fulfillment of the requirement for:**
- **Degree**: Bachelor of Technology in Computer Science & Engineering (AI & DS)
- **Institution**: Graphic Era (Deemed to be University), Dehradun, Uttarakhand

**Team Members:**
- Aditya Sirohi (2021641)
- Chahat Rathi (2021674)
- Himakshi Bhakuni (2021694)
- Chaksh Khurana (2021675)

**Project Team ID**: MP2025AI&DS29

**Supervisor**: Mr. Rohan Verma, Assistant Professor, Department of Computer Science and Engineering

**Period**: August 2025 - May 2026

---

## 🎥 System Demonstration

### User Walkthrough

1. **Initialize System**
   - Click "Initialize Core" on landing page
   - Select role (Admin/Driver)
   - Enter credentials to access dashboard

2. **Admin Dashboard**
   - Monitor incoming emergency requests
   - Review trip details
   - Approve emergency trips
   - Track real-time vehicle movement
   - Monitor traffic signal status

3. **Driver Interface**
   - Enter source and destination
   - Wait for command center approval
   - View assigned route on map
   - Start trip
   - Monitor position in real-time
   - Observe junction signal changes

4. **Real-Time Interaction**
   - Watch vehicle move along route
   - See traffic signals change dynamically
   - Monitor time savings metrics
   - Track signal preemption events

---

## 📈 System Capabilities & Impact

### Performance Features
- **Low-Latency Communication**: Real-time synchronization via WebSocket
- **Efficient Route Planning**: Optimized paths reducing travel time
- **Automatic Signal Control**: Preemptive traffic management
- **Centralized Monitoring**: Complete situational awareness

### User Benefits
- ✅ Faster emergency responses
- ✅ Improved safety for road users and emergency personnel
- ✅ Reduced response time through dynamic signal control
- ✅ Clear visibility and coordination

### Community Benefits
- ✅ Enhanced trust in emergency systems
- ✅ Reduced traffic delays for emergency vehicles
- ✅ Improved traffic management infrastructure

### Social Impact
- ✅ Potential reduction in loss of life during emergencies
- ✅ Better resource utilization
- ✅ Scalable solution for urban environments

### Economic Impact
- ✅ Lower fuel costs through optimized routing
- ✅ Reduced traffic congestion
- ✅ Infrastructure efficiency improvements

---

## 📋 System Requirements

### Software Requirements
- **OS**: Windows / Linux
- **IDE**: Visual Studio Code
- **Version Control**: Git, GitHub
- **Frontend**: Node.js 16+, npm/yarn
- **Backend**: Node.js 16+, MongoDB
- **IoT Development**: Arduino IDE (for ESP32)

### Hardware Requirements
- **Development System**:
  - Processor: Intel i5 or equivalent
  - RAM: 8 GB or higher
  - Storage: 256 GB or higher
- **IoT Hardware**:
  - ESP32 Microcontroller (for signal simulation)
  - Optional: LED indicators for traffic signal visualization
- **Network**: Stable internet connection for real-time communication

---

## 🛠️ Installation & Setup

### Backend Setup
```bash
# Clone repository
git clone https://github.com/aditya0sirohi/Emergency-Vehicle-Priority-System-Simulation-.git

# Install dependencies
npm install

# Configure MongoDB connection
# Update .env with MongoDB Atlas URI

# Start backend server
npm start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### IoT Setup
```bash
# Upload ESP32 firmware
# Open Arduino IDE and configure ESP32 board
# Deploy mock ATCS simulation code
```

---

## 📚 References

[1] Chahat Rathi, Chaksh Khurana, Himakshi Bhakuni, Aditya Sirohi, "Emergency Vehicle Priority System using IoT and AI-based Traffic Optimization," Department of Computer Science and Engineering, Graphic Era (Deemed to be University), Dehradun, India, 2026.

[2] A. H. Khan and M. F. Khan, "AI-Driven Smart Ambulance Traffic Management System for Urban Environments," Asian Hospital and Healthcare Management, 2024.

[3] Commsignia, "Preemption reduces response times for emergency vehicles," 2025.

[4] A. Goyal, A. Jain, et al., "AI-Driven Emergency Vehicle Detection for Signal Optimisation Using YOLOv8," IJRASET, vol. 13, no. 3, 2025.

[5] K. V. Pavan, B. Srimanth, et al., "Hybrid CNN-LSTM Models for Traffic Flow Prediction in Smart Cities," 2025.

[6] T. S. Rani and K. Niharika, "AI-Based Dynamic Traffic Management System with Real-Time Detection & Priority Signal Optimization," International Journal of Advanced Research in Computer and Communication Engineering, vol. 14, no. 5, 2025.

[7] P. Udhan, A. Ganeshkar, et al., "Vehicle Route Planning using Dynamically Weighted Dijkstra's Algorithm with Traffic Prediction," arXiv:2205.15190, May 2022.

[8-10] Standards: IEEE 802.11p (Wireless Access in Vehicular Environments), IEEE 1609.x (Secure Vehicular Communication), IEEE 2040 (Automation for Traffic Management)

---

## 🔮 Future Scope

The system provides a strong foundation for further development and real-world deployment:

### Short-Term Enhancements
- Integration with real Adaptive Traffic Control Systems (ATCS)
- Advanced route optimization with dynamic traffic conditions
- Enhanced data persistence and analytics

### Medium-Term Developments
- Multi-hospital selection system with real-time resource availability
- AI-based traffic prediction using CNN-LSTM models
- Expanded IoT integration with multiple traffic junctions

### Long-Term Vision
- Cloud-based distributed architecture for large-scale deployment
- Integration with 5G-V2X communication standards
- Real-world deployment across multiple cities
- Machine learning-based predictive traffic management

---

## 📂 Repository Structure

```
Emergency-Vehicle-Priority-System-Simulation/
├── frontend/              # Next.js/React frontend
│   ├── components/       # React components
│   ├── pages/           # Page components
│   └── public/          # Static assets
├── backend/              # Node.js/Express backend
│   ├── routes/          # API endpoints
│   ├── controllers/      # Business logic
│   ├── models/          # Data models
│   └── socket/          # WebSocket events
├── iot/                  # ESP32 simulation code
│   └── esp32_mock/      # Mock ATCS firmware
├── docs/                 # Documentation
└── README.md            # This file
```

---

## 📖 Documentation

Complete project documentation including design diagrams, testing procedures, and implementation details is available in the project repository:
- [System Design Documents](./docs/)
- [Use Case Diagrams](./docs/use_case_diagrams.md)
- [Sequence Diagrams](./docs/sequence_diagrams.md)
- [Testing Reports](./docs/testing_reports.md)

---

## 🤝 Contributing

This is an academic project. For collaboration, research, or implementation inquiries, please contact the project team through the repository.

---

## 📄 License

This project is submitted as a Bachelor of Technology capstone project. Academic use and research extensions are welcome with proper attribution.

---

## 📞 Contact & Support

For questions, feedback, or collaboration regarding this project:

**Repository**: [GitHub - Emergency Vehicle Priority System](https://github.com/aditya0sirohi/Emergency-Vehicle-Priority-System-Simulation-)

**Alternative Repository**: [GitHub - Green Corridor](https://github.com/Chahatrathi/greencorridor)

---

## 🙏 Acknowledgments

We express our gratitude to:
- **Prof. (Dr.) Devesh Pratap Singh**, HOD, Department of Computer Science and Engineering
- **Mr. Rohan Verma**, Assistant Professor, who guided and supervised this project
- Graphic Era (Deemed to be University), Dehradun, for providing resources and support

---

**Project Status**: ✅ Complete & Operational (Simulation Environment)

**Last Updated**: May 2026

---

*"Emergency Response Time Matters - Every Minute Saved Can Mean Lives and Property Saved"*
