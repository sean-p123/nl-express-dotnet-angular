import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DeliveryService, DeliveryJob } from './delivery.service';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(DeliveryService);
    httpMock = TestBed.inject(HttpTestingController);

    // Prevent SignalR from opening a real WebSocket during offline unit tests
    (service as any).hubConnection.stop();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch deliveries via GET /api/deliveries', () => {
    const mockJobs: DeliveryJob[] = [
      { id: '1', packageManifest: 'Electronics', destinationCity: 'Amsterdam', postalCode: '1012 JS', status: 'Pending' }
    ];

    service.getDeliveries().subscribe(jobs => {
      expect(jobs.length).toBe(1);
      expect(jobs[0].destinationCity).toBe('Amsterdam');
    });

    const req = httpMock.expectOne('http://localhost:5041/api/deliveries');
    expect(req.request.method).toBe('GET');
    req.flush(mockJobs);
  });

  it('should dispatch a new delivery via POST /api/deliveries', () => {
    const newJob: DeliveryJob = {
      packageManifest: 'Stroopwafels',
      destinationCity: 'Den Haag',
      postalCode: '2511 AA'
    };

    service.createDelivery(newJob).subscribe(created => {
      expect(created.id).toBe('2');
      expect(created.status).toBe('Pending');
    });

    const req = httpMock.expectOne('http://localhost:5041/api/deliveries');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newJob);
    req.flush({ ...newJob, id: '2', status: 'Pending' });
  });

  it('should reset demo data via POST /api/deliveries/reset', () => {
    service.resetData().subscribe(resetList => {
      expect(resetList).toEqual([]);
    });

    const req = httpMock.expectOne('http://localhost:5041/api/deliveries/reset');
    expect(req.request.method).toBe('POST');
    req.flush([]);
  });
});
