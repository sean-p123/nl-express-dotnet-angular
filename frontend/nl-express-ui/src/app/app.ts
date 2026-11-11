import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DeliveryService, DeliveryJob } from './delivery.service';

@Component({
  selector: 'app-root',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private deliveryService = inject(DeliveryService);
  private fb = inject(FormBuilder);

  deliveries = signal<DeliveryJob[]>([]);
  errorMessage = signal<string | null>(null);

  //Add frontend form validation to match the backend
  dispatchForm = this.fb.nonNullable.group({
    manifest: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required]],
    postalCode: ['', [
      Validators.required,
      Validators.pattern(/^[1-9][0-9]{3}\s?[A-Za-z]{2}$/)
    ]]
  });
  
  manifest: string = '';
  city: string = '';
  postalCode: string = '';

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
    // Prevent API call if frontend validation fails
    if(this.dispatchForm.invalid){
      this.dispatchForm.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const formValues = this.dispatchForm.getRawValue();

    const newJob: DeliveryJob = {
      packageManifest: formValues.manifest,
      destinationCity: formValues.city,
      postalCode: formValues.postalCode.trim().toUpperCase()
    };

    this.deliveryService.createDelivery(newJob).subscribe({
      next: createdJob => {
      this.deliveries.update(list => [createdJob, ...list]);
      this.dispatchForm.reset();
    },
    error: err => {
      const validationErrors = err.error?.errors;
          if (validationErrors) {
            const firstKey = Object.keys(validationErrors)[0];
            this.errorMessage.set(validationErrors[firstKey][0]);
          } else {
            this.errorMessage.set('Failed to dispatch package.');
          }
    }});
  }

  resetData(){
    this.errorMessage.set(null);
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
