import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';
import RPCCall from '/lib/jsonrpc.mjs';

customElements.define('pdp-info', class PDPElement extends LitElement {
    static properties = {
        services: { type: Array },
        showAddServiceForm: { type: Boolean },
    }

    constructor() {
        super();
        this.services = [];
        this.showAddServiceForm = false;
        this.loadServices();
    }

    async loadServices() {
        try {
            this.services = await RPCCall('PDPServices', []);
        } catch (error) {
            console.error('Failed to load PDP services:', error);
        }
    }

    toggleAddServiceForm() {
        this.showAddServiceForm = !this.showAddServiceForm;
    }

    async addService(event) {
        event.preventDefault();

        const nameInput = this.shadowRoot.getElementById('service-name');
        const pubKeyInput = this.shadowRoot.getElementById('service-pubkey');

        const name = nameInput.value.trim();
        const pubKey = pubKeyInput.value.trim();

        if (!name || !pubKey) {
            alert('Please provide both a name and a public key.');
            return;
        }

        try {
            // Call the RPC method to add the new PDP service
            await RPCCall('AddPDPService', [name, pubKey]);

            // Reset the form
            nameInput.value = '';
            pubKeyInput.value = '';

            // Reload the services
            await this.loadServices();

            // Hide the form
            this.showAddServiceForm = false;
        } catch (error) {
            console.error('Failed to add PDP service:', error);
            alert('Failed to add PDP service: ' + (error.message || error));
        }
    }

    async removeService(serviceId, serviceName) {
        const confirmed = confirm(`Are you sure you want to remove the service "${serviceName}"?`);
        if (!confirmed) {
            return;
        }

        try {
            // Call the RPC method to remove the PDP service
            await RPCCall('RemovePDPService', [serviceId]);

            // Reload the services
            await this.loadServices();
        } catch (error) {
            console.error('Failed to remove PDP service:', error);
            alert('Failed to remove PDP service: ' + (error.message || error));
        }
    }

    render() {
        return html`
            <!-- Include Bootstrap CSS -->
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
                rel="stylesheet">
            <link rel="stylesheet" href="/ux/main.css" onload="document.body.style.visibility = 'initial'">

            <div class="container-fluid" style="min-width: 70em">
                <h2>PDP Services</h2>
                ${this.services.length > 0 ? html`
                    <table class="table table-dark table-striped w-100">
                        <thead>
                            <tr>
                                <th style="width: 5%;">ID</th>
                                <th style="width: 20%;">Name</th>
                                <th style="width: 65%;">Public Key</th>
                                <th style="width: 10%;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.services.map(service => html`
                                <tr>
                                    <td>${service.id}</td>
                                    <td>${service.name}</td>
                                    <td style="word-wrap: break-word;">
                                        <textarea readonly rows="4" class="form-control w-100" style="overflow-x: auto;">${service.pubkey}</textarea>
                                    </td>
                                    <td>
                                        <button class="btn btn-danger btn-sm" @click="${() => this.removeService(service.id, service.name)}">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                ` : html`
                    <p>No PDP services available.</p>
                `}

                <button class="btn btn-primary" @click="${this.toggleAddServiceForm}">
                    ${this.showAddServiceForm ? 'Cancel' : 'Add PDP Service'}
                </button>

                ${this.showAddServiceForm ? html`
                    <form @submit="${this.addService}" style="margin-top: 20px;">
                        <div class="mb-3">
                            <label for="service-name" class="form-label">Service Name</label>
                            <input type="text" class="form-control" id="service-name" required>
                        </div>
                        <div class="mb-3">
                            <label for="service-pubkey" class="form-label">Public Key</label>
                            <textarea class="form-control" id="service-pubkey" rows="5" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-success">Add Service</button>
                    </form>
                ` : ''}
            </div>
        `;
    }
});