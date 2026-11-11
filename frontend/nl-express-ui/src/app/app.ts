import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DeliveryService, DeliveryJob } from './delivery.service';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App implements OnInit {
  private deliveryService = inject(DeliveryService);

  deliveries = signal<DeliveryJob[]>([]);

  manifest = '';
  city = '';
  postalCode = '';

  ngOnInit(): void {
    this.loadDeliveries();

    // Reload the full list whenever the backend restarts and SignalR reconnects
    this.deliveryService.reconnected$.subscribe(()=> {
      console.log("Reconnected!!")
      this.loadDeliveries();
    })
    
    // Handle status updates
    this.deliveryService.deliveryUpdated$.subscribe(updatedJob => {
      this.deliveries.update(currentList =>
        currentList.map(job => (job.id === updatedJob.id ? updatedJob : job))
      );
    });

    this.deliveryService.deliveriesReset$.subscribe((freshList)=> {
      this.deliveries.set(freshList);
    })
  }

  private loadDeliveries(): void {
    this.deliveryService.getDeliveries().subscribe(data => {
      this.deliveries.set(data);
    });
  }

  addPackage(): void {
    if (!this.manifest || !this.city || !this.postalCode) return;

    const newJob: DeliveryJob = {
      packageManifest: this.manifest,
      destinationCity: this.city,
      postalCode: this.postalCode
    };

    this.deliveryService.createDelivery(newJob).subscribe(createdJob => {
      this.deliveries.update(list => [createdJob, ...list]);
      this.manifest = '';
      this.city = '';
      this.postalCode = '';
    });
  }

  resetData(){
    console.log("Reset button clicked");
    this.deliveryService.resetData().subscribe(freshlist => {
      this.deliveries.set(freshlist);
    });
  }

  getStatusColor(status?: string): string {
    if (status === 'Delivered') return 'green';
    if (status === 'InTransit') return 'orange';
    return 'gray';
  }
}
