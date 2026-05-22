const Docker = require('dockerode');
const { exec } = require('child_process');
const path = require('path');

class DockerManager {
  constructor() {
    this.docker = new Docker();
    this.backendContainerName = 'compliance-tracker-backend';
    this.frontendContainerName = 'compliance-tracker-frontend';
    this.networkName = 'compliance-network';
  }

  // Check if Docker Desktop is running
  async isDockerRunning() {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      console.error('Docker is not running:', error.message);
      return false;
    }
  }

  // Start Docker Desktop
  async startDockerDesktop() {
    return new Promise((resolve, reject) => {
      const dockerPath = 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe';
      exec(`start "" "${dockerPath}"`, (error) => {
        if (error) {
          console.error('Failed to start Docker Desktop:', error);
          reject(error);
        } else {
          console.log('Docker Desktop starting...');
          // Wait for Docker to be ready
          this.waitForDocker().then(resolve).catch(reject);
        }
      });
    });
  }

  // Wait for Docker to be ready
  async waitForDocker(maxAttempts = 30) {
    console.log('Waiting for Docker to be ready...');
    for (let i = 0; i < maxAttempts; i++) {
      if (await this.isDockerRunning()) {
        console.log('Docker is ready!');
        return true;
      }
      console.log(`Attempt ${i + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Docker failed to start within timeout period');
  }

  // Check if containers are running
  async areContainersRunning() {
    try {
      const containers = await this.docker.listContainers();
      const backendRunning = containers.some(c => 
        c.Names.some(name => name.includes(this.backendContainerName))
      );
      return backendRunning;
    } catch (error) {
      console.error('Error checking containers:', error.message);
      return false;
    }
  }

  // Start containers using docker-compose
  async startContainers(appPath) {
    return new Promise((resolve, reject) => {
      const composePath = path.join(appPath, 'docker-compose.yml');
      const cmd = `docker-compose -f "${composePath}" up -d`;
      
      console.log('Starting containers with command:', cmd);
      console.log('Working directory:', path.dirname(composePath));
      
      exec(cmd, { cwd: path.dirname(composePath) }, (error, stdout, stderr) => {
        if (error) {
          console.error('Docker compose error:', stderr);
          reject(error);
        } else {
          console.log('Containers started:', stdout);
          resolve();
        }
      });
    });
  }

  // Stop containers
  async stopContainers(appPath) {
    return new Promise((resolve, reject) => {
      const composePath = path.join(appPath, 'docker-compose.yml');
      const cmd = `docker-compose -f "${composePath}" down`;
      
      console.log('Stopping containers with command:', cmd);
      
      exec(cmd, { cwd: path.dirname(composePath) }, (error, stdout, stderr) => {
        if (error) {
          console.error('Docker compose stop error:', stderr);
          reject(error);
        } else {
          console.log('Containers stopped:', stdout);
          resolve();
        }
      });
    });
  }

  // Get container logs
  async getContainerLogs(containerName) {
    try {
      const container = this.docker.getContainer(containerName);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100
      });
      return logs.toString();
    } catch (error) {
      return `Error getting logs: ${error.message}`;
    }
  }

  // Wait for backend to be ready
  async waitForBackend(maxAttempts = 30) {
    console.log('Waiting for backend to be ready...');
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:8000/health');
        if (response.ok) {
          console.log('Backend is ready!');
          return true;
        }
      } catch (error) {
        // Continue waiting
      }
      console.log(`Waiting for backend... Attempt ${i + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Backend failed to start within timeout period');
  }
}

module.exports = DockerManager;

// Made with Bob
