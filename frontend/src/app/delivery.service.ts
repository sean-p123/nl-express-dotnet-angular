import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

export interface DeliveryJob {
  id?: string;
  packageManifest: string;
  destinationCity: string;
  postalCode: string;
  status?: 'Pending' | 'InTransit' | 'Delivered';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);

  private apiUrl = 'http://localhost:5041/api/deliveries';
  private hubUrl = 'http://localhost:5041/hubs/deliveries';

  private hubConnection: signalR.HubConnection;
  private deliveryUpdatedSubject = new Subject<DeliveryJob>();
  private reconnectedSubject = new Subject<void>();
  private deliveryResetSubject = new Subject<DeliveryJob[]>();

  public deliveryUpdated$ = this.deliveryUpdatedSubject.asObservable();
  public reconnected$ = this.reconnectedSubject.asObservable();
  public deliveriesReset$ = this.deliveryResetSubject.asObservable();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.registerListeners()
    this.startConnection();
  }

  // Detect when SignalR reconnects after a backend restart
  private registerListeners(): void{
    // Listen for individual status updates
    this.hubConnection.on('DeliveryUpdated', (updatedJob: DeliveryJob) => {
        this.ngZone.run(()=> {
            this.deliveryUpdatedSubject.next(updatedJob);
        });
    });

    this.hubConnection.on("DeliveriesReset", (freshList: DeliveryJob[]) => {
        this.ngZone.run(()=> {
            this.deliveryResetSubject.next(freshList);
        });
    });
  }

  private async startConnection(): Promise<void> {
    try {
        await this.hubConnection.start();
        console.log('Connected to NL-Express SignalR Hub');
        } catch (err) {
        console.error('SignalR connection failed:', err);
        // Retry initial connection if backend was offline when Angular first loaded
        setTimeout(() => this.startConnection(), 3000);
        }
  }

  getDeliveries(): Observable<DeliveryJob[]> {
    return this.http.get<DeliveryJob[]>(this.apiUrl);
  }

  createDelivery(job: DeliveryJob): Observable<DeliveryJob> {
    return this.http.post<DeliveryJob>(this.apiUrl, job);
  }

  resetData(): Observable<DeliveryJob[]>{
    return this.http.post<DeliveryJob[]>(`${this.apiUrl}/reset`, {});
  }
}
