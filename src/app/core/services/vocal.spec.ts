import { TestBed } from '@angular/core/testing';

import { Vocal } from './vocal';

describe('Vocal', () => {
  let service: Vocal;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Vocal);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
