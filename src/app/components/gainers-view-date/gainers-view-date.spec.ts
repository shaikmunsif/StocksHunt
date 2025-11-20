import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GainersViewDate } from './gainers-view-date';

describe('GainersViewDate', () => {
  let component: GainersViewDate;
  let fixture: ComponentFixture<GainersViewDate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GainersViewDate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GainersViewDate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
