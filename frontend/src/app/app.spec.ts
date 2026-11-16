import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { App } from './app';
import { DeliveryService, DeliveryJob } from './delivery.service';

describe('App Component', () => {
  let deliveryUpdatedSubject: Subject<DeliveryJob>;
  let deliveriesResetSubject: Subject<DeliveryJob[]>;
  let mockDeliveryService: any;

  const initialMockData: DeliveryJob[] = [
    {
      id: '101',
      packageManifest: 'Electronics',
      destinationCity: 'Amsterdam',
      postalCode: '1012 JS',
      status: 'Pending'
    }
  ];

  beforeEach(async () => {
    deliveryUpdatedSubject = new Subject<DeliveryJob>();
    deliveriesResetSubject = new Subject<DeliveryJob[]>();

    // Mock DeliveryService so tests run offline without SignalR or HTTP calls
    mockDeliveryService = {
      deliveryUpdated$: deliveryUpdatedSubject.asObservable(),
      deliveriesReset$: deliveriesResetSubject.asObservable(),
      getDeliveries: () => of(initialMockData),
      createDelivery: (job: DeliveryJob) => of({ ...job, id: '102', status: 'Pending' }),
      resetDeliveries: () => of(initialMockData)
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: DeliveryService, useValue: mockDeliveryService }
      ]
    }).compileComponents();
  });

  it('should load initial deliveries into the signal on startup', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const deliveries = fixture.componentInstance.deliveries();
    expect(deliveries.length).toBe(1);
    expect(deliveries[0].destinationCity).toBe('Amsterdam');
  });

  it('should mark dispatchForm invalid when Dutch postal code is wrong', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    component.dispatchForm.setValue({
      manifest: 'Stroopwafels',
      city: 'Den Haag',
      postalCode: '0000 AA'
    });

    expect(component.dispatchForm.invalid).toBe(true);
    expect(component.dispatchForm.controls.postalCode.hasError('pattern')).toBe(true);
  });

  it('should mark dispatchForm valid when all fields match Dutch rules', () => {
    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    component.dispatchForm.setValue({
      manifest: 'Stroopwafels',
      city: 'Den Haag',
      postalCode: '2511 AA'
    });

    expect(component.dispatchForm.valid).toBe(true);
  });

  it('should update a package status live when SignalR emits DeliveryUpdated', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    deliveryUpdatedSubject.next({
      id: '101',
      packageManifest: 'Electronics',
      destinationCity: 'Amsterdam',
      postalCode: '1012 JS',
      status: 'InTransit'
    });

    const updatedItem = fixture.componentInstance.deliveries()[0];
    expect(updatedItem.status).toBe('InTransit');
  });

  it('should display backend FluentValidation errors if API rejects submission', () => {
    mockDeliveryService.createDelivery = () =>
      throwError(() => ({
        error: {
          errors: {
            PostalCode: ['Invalid Dutch postal code format.']
          }
        }
      }));

    const fixture = TestBed.createComponent(App);
    const component = fixture.componentInstance;

    component.dispatchForm.setValue({
      manifest: 'Tulips',
      city: 'Rotterdam',
      postalCode: '3011 WN'
    });

    component.addPackage();

    expect(component.errorMessage()).toBe('Invalid Dutch postal code format.');
  });
});
