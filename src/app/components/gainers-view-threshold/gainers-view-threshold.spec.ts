import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GainersViewThreshold } from './gainers-view-threshold';

describe('GainersViewThreshold', () => {
  let component: GainersViewThreshold;
  let fixture: ComponentFixture<GainersViewThreshold>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GainersViewThreshold]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GainersViewThreshold);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
